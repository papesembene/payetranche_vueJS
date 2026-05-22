import { http } from './http.js';
import { auth } from '../firebase.js';
import { getUserFriendlyError } from '../utils/userFriendlyError.js';
import {
  getRedirectResult,
  FacebookAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';

const socialProviderLabels = {
  google: 'Google',
  facebook: 'Facebook'
};

const backendPlanToFrontendPlan = (plan) => {
  const plans = {
    GRATUIT: 'free',
    PRO: 'pro',
    ENTREPRISE: 'enterprise'
  };
  return plans[plan] || 'free';
};

const normalizeUser = (user, tenant = null) => {
  const plan = backendPlanToFrontendPlan(user.plan);

  return {
    ...user,
    tenantId: user.tenantId || tenant?.id,
    phone: user.phone || (user.email?.endsWith('@paytranche.local') ? user.email.replace('@paytranche.local', '') : ''),
    onboardingCompleted: Boolean(user.onboardingCompleted),
    avatar: user.name?.charAt(0)?.toUpperCase() || 'U',
    subscription: {
      id: `sub_${user.id}`,
      plan,
      status: 'active',
      currentPeriodStart: user.createdAt || new Date().toISOString(),
      currentPeriodEnd: user.planExpiresAt || null,
      cancelAtPeriodEnd: false,
      trialEnd: null,
      recurringPayment: false
    },
    usage: {
      clients: 0,
      payments: 0,
      totalAmount: 0
    }
  };
};

const socialAuthErrorMessage = (error, providerName) => {
  const providerLabel = socialProviderLabels[providerName] || 'ce service';
  const messages = {
    'auth/popup-blocked': `La fenêtre ${providerLabel} a été bloquée. Autorisez les fenêtres popup puis réessayez.`,
    'auth/popup-closed-by-user': `Connexion ${providerLabel} annulée. Cliquez sur le bouton et terminez la connexion dans la fenêtre ouverte.`,
    'auth/cancelled-popup-request': `Une connexion ${providerLabel} est déjà en cours. Fermez l'autre fenêtre puis réessayez.`,
    'auth/operation-not-allowed': `Connexion ${providerLabel} indisponible pour le moment. Réessayez plus tard.`,
    'auth/invalid-provider-id': `Connexion ${providerLabel} indisponible pour le moment. Réessayez plus tard.`,
    'auth/invalid-app-id': 'Connexion Facebook indisponible pour le moment. Réessayez plus tard.',
    'auth/invalid-oauth-client-id': `Connexion ${providerLabel} indisponible pour le moment. Réessayez plus tard.`,
    'auth/unauthorized-domain': 'Connexion impossible depuis cette adresse. Réessayez plus tard.',
    'auth/account-exists-with-different-credential': 'Un compte existe déjà avec cet email. Connectez-vous avec la méthode utilisée au départ.',
    'auth/invalid-credential': `Connexion ${providerLabel} impossible pour le moment. Réessayez plus tard.`,
    'auth/popup-timeout': `Connexion ${providerLabel} non terminée. Rechargez la page puis réessayez.`
  };

  if (messages[error?.code]) {
    return messages[error.code];
  }

  if (error?.code === 'ERR_NETWORK') {
    return 'Connexion impossible pour le moment. Vérifiez votre internet puis réessayez.';
  }

  if (error?.code === 'ECONNABORTED') {
    return 'Connexion trop lente. Réessayez dans quelques instants.';
  }

  return getUserFriendlyError(error, 'auth');
};

class AuthService {
  getSocialProvider(providerName) {
    if (providerName === 'facebook') {
      const provider = new FacebookAuthProvider();
      provider.addScope('email');
      provider.setCustomParameters({
        display: 'popup'
      });
      return provider;
    }

    if (providerName !== 'google') {
      throw new Error('Méthode de connexion non disponible.');
    }

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });

    return provider;
  }

  persistAuthSession(token, user, tenant = null) {
    const safeUser = normalizeUser(user, tenant);
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(safeUser));
    return safeUser;
  }

  rememberSocialAuth(providerName, options = {}) {
    localStorage.setItem('social_auth_provider', providerName);
    if (options.companyName) {
      localStorage.setItem('social_auth_company_name', options.companyName);
    } else {
      localStorage.removeItem('social_auth_company_name');
    }
  }

  clearSocialAuthMemory() {
    localStorage.removeItem('social_auth_provider');
    localStorage.removeItem('social_auth_company_name');
  }

  hasPendingSocialAuth() {
    return Boolean(localStorage.getItem('social_auth_provider'));
  }

  waitForFirebaseUser(timeoutMs = 2500) {
    if (auth.currentUser) return Promise.resolve(auth.currentUser);

    return new Promise((resolve) => {
      let unsubscribe = () => {};
      const timeout = window.setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, timeoutMs);

      unsubscribe = onAuthStateChanged(auth, (user) => {
        window.clearTimeout(timeout);
        unsubscribe();
        resolve(user || null);
      });
    });
  }

  async signInWithPopupOrState(provider) {
    const popupResult = signInWithPopup(auth, provider).then((result) => ({
      user: result.user
    })).catch((error) => ({
      error
    }));

    const stateResult = this.waitForFirebaseUser(3e4).then((user) => ({
      user
    }));

    const result = await Promise.race([popupResult, stateResult]);
    const firebaseUser = result.user || auth.currentUser || await this.waitForFirebaseUser(1500);

    if (firebaseUser) {
      return firebaseUser;
    }

    if (result.error) {
      throw result.error;
    }

    const timeoutError = new Error('Popup authentication timed out');
    timeoutError.code = 'auth/popup-timeout';
    throw timeoutError;
  }

  async completeFirebaseUser(firebaseUser, companyName) {
    if (!firebaseUser) {
      throw new Error('Connexion impossible.');
    }

    const idToken = await firebaseUser.getIdToken(true);

    const response = await http.post('/auth/social', {
      provider: 'firebase',
      idToken,
      companyName
    });

    this.clearSocialAuthMemory();

    const { token, user, tenant } = response.data.data;
    const safeUser = this.persistAuthSession(token, user, tenant);

    return { success: true, user: safeUser };
  }

  async loginWithGoogleToken(idToken, companyName) {
    const response = await http.post('/auth/social', {
      provider: 'google',
      idToken,
      companyName
    });

    this.clearSocialAuthMemory();

    const { token, user, tenant } = response.data.data;
    const safeUser = this.persistAuthSession(token, user, tenant);

    return { success: true, user: safeUser };
  }

  async loginWithSocial(providerName, options = {}) {
    try {
      if (providerName === 'google' && options.idToken) {
        return await this.loginWithGoogleToken(options.idToken, options.companyName);
      }

      this.rememberSocialAuth(providerName, options);

      const provider = this.getSocialProvider(providerName);

      if (options.usePopup === false) {
        await signInWithRedirect(auth, provider);
        return { success: true, pendingRedirect: true };
      }

      const firebaseUser = await this.signInWithPopupOrState(provider);
      return await this.completeFirebaseUser(firebaseUser, options.companyName);
    } catch (error) {
      this.clearSocialAuthMemory();
      throw new Error(socialAuthErrorMessage(error, providerName));
    }
  }

  async completeSocialRedirect() {
    try {
      const result = await getRedirectResult(auth);
      const firebaseUser = result?.user || await this.waitForFirebaseUser(10000);

      if (!firebaseUser) {
        return { success: false, pendingRedirect: false };
      }

      const companyName = localStorage.getItem('social_auth_company_name') || undefined;
      return await this.completeFirebaseUser(firebaseUser, companyName);
    } catch (error) {
      const providerName = localStorage.getItem('social_auth_provider') || 'google';
      this.clearSocialAuthMemory();
      throw new Error(socialAuthErrorMessage(error, providerName));
    }
  }

  async logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_data');
    return { success: true };
  }

  async verifyToken() {
    try {
      const userData = localStorage.getItem('auth_user');
      const token = localStorage.getItem('auth_token');
      if (!userData || !token) return { valid: false };

      const response = await http.get('/auth/me');
      const serverUser = response.data.data.user;
      const user = normalizeUser(serverUser);
      localStorage.setItem('auth_user', JSON.stringify(user));
      return { valid: true, user };
    } catch (error) {
      if (error?.response?.status === 401) {
        localStorage.removeItem('auth_token');
        return { valid: false };
      }

      try {
        const cachedUser = JSON.parse(userData);
        return { valid: true, user: cachedUser, offline: true };
      } catch {
        return { valid: false };
      }
    }
  }
}

export const authService = new AuthService();
