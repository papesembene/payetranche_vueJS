import { http } from './http.js';
import { auth } from '../firebase.js';
import {
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect
} from 'firebase/auth';

const cleanPhone = (phoneNumber = '') =>
  phoneNumber.replace(/\s+/g, '').replace(/^\+221/, '').replace(/^221/, '');

const phoneToEmail = (phoneNumber) => `${cleanPhone(phoneNumber)}@paytranche.local`;

const pinToPassword = (pin) => `${pin}${pin}`;

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

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
  const providerLabel = 'Google';
  const currentHost = window.location.host || 'localhost';

  const messages = {
    'auth/popup-blocked': `La fenêtre ${providerLabel} a été bloquée. Autorisez les popups pour ${currentHost} puis réessayez.`,
    'auth/popup-closed-by-user': `Connexion ${providerLabel} annulée. Cliquez sur le bouton et terminez la connexion dans la fenêtre ouverte.`,
    'auth/cancelled-popup-request': `Une connexion ${providerLabel} est déjà en cours. Fermez l’autre fenêtre puis réessayez.`,
    'auth/operation-not-allowed': `${providerLabel} n’est pas encore activé dans Firebase Authentication.`,
    'auth/unauthorized-domain': 'Le domaine localhost n’est pas autorisé dans Firebase Authentication.',
    'auth/account-exists-with-different-credential': 'Un compte existe déjà avec cet email. Connectez-vous avec la méthode utilisée au départ.',
    'auth/popup-timeout': `Connexion ${providerLabel} bloquée après le choix du compte. Fermez la fenêtre ${providerLabel}, rechargez la page, puis réessayez.`
  };

  if (error?.code === 'ERR_NETWORK') {
    return 'Connexion Google réussie, mais le backend PayTranche ne répond pas. Vérifiez que le backend tourne sur localhost:8000.';
  }

  if (error?.code === 'ECONNABORTED') {
    return 'Connexion Google réussie, mais le backend PayTranche met trop de temps à répondre.';
  }

  return messages[error?.code] || error.response?.data?.message || error.message || `Connexion ${providerLabel} impossible`;
};

class AuthService {
  getSocialProvider(providerName) {
    if (providerName !== 'google') {
      throw new Error('Seule la connexion Google est disponible.');
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

  waitForFirebaseUser(timeoutMs = 2500) {
    if (auth.currentUser) return Promise.resolve(auth.currentUser);

    return new Promise((resolve) => {
      let unsubscribe = () => {};
      const timeout = window.setTimeout(() => {
        unsubscribe();
        resolve(null);
      }, timeoutMs);

      unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        window.clearTimeout(timeout);
        unsubscribe();
        resolve(firebaseUser || null);
      });
    });
  }

  async signInWithPopupOrState(provider) {
    const popupResult = signInWithPopup(auth, provider)
      .then((result) => ({ user: result.user }))
      .catch((error) => ({ error }));

    const authStateResult = this.waitForFirebaseUser(30000)
      .then((user) => ({ user }));

    const firstResult = await Promise.race([popupResult, authStateResult]);
    const firebaseUser = firstResult.user || auth.currentUser || await this.waitForFirebaseUser(1500);

    if (firebaseUser) {
      return firebaseUser;
    }

    if (firstResult.error) {
      throw firstResult.error;
    }

    const timeoutError = new Error('Popup authentication timed out');
    timeoutError.code = 'auth/popup-timeout';
    throw timeoutError;
  }

  async completeFirebaseUser(firebaseUser, companyName) {
    const idToken = await firebaseUser.getIdToken(true);
    const response = await http.post('/auth/social', {
      idToken,
      provider: 'firebase',
      companyName
    });

    this.clearSocialAuthMemory();

    const { token, user, tenant } = response.data.data;
    const safeUser = this.persistAuthSession(token, user, tenant);

    return { success: true, user: safeUser };
  }

  async loginWithGoogleCredential(idToken, options = {}) {
    try {
      const response = await http.post('/auth/social', {
        idToken,
        provider: 'google',
        companyName: options.companyName
      });

      const { token, user, tenant } = response.data.data;
      const safeUser = this.persistAuthSession(token, user, tenant);

      return { success: true, user: safeUser };
    } catch (error) {
      throw new Error(socialAuthErrorMessage(error, 'google'));
    }
  }

  loadGoogleIdentityScript() {
    if (window.google?.accounts?.id) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const existingScript = document.getElementById('google-identity-services');
      if (existingScript) {
        existingScript.addEventListener('load', resolve, { once: true });
        existingScript.addEventListener('error', reject, { once: true });
        return;
      }

      const script = document.createElement('script');
      script.id = 'google-identity-services';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error('Impossible de charger Google Sign-In'));
      document.head.appendChild(script);
    });
  }

  async renderGoogleButton(container, options = {}) {
    if (!container) return;
    if (!googleClientId) {
      throw new Error('Google Sign-In n’est pas configuré');
    }

    await this.loadGoogleIdentityScript();
    container.innerHTML = '';

    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => {
        if (!response?.credential) {
          options.onError?.('Google n’a pas renvoyé de jeton de connexion.');
          return;
        }
        options.onCredential?.(response.credential);
      }
    });

    window.google.accounts.id.renderButton(container, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'rectangular',
      text: options.text || 'continue_with',
      logo_alignment: 'left',
      width: Math.min(container.clientWidth || 360, 400)
    });
  }

  async login(credentials) {
    try {
      const email = credentials.email || phoneToEmail(credentials.phone);
      const password = credentials.password || pinToPassword(credentials.pin);

      const response = await http.post('/auth/login', { email, password });

      const { token, user } = response.data.data;
      const safeUser = this.persistAuthSession(token, user);

      return { success: true, user: safeUser };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Erreur de connexion');
    }
  }

  async register(userData) {
    try {
      const phone = userData.phone ? cleanPhone(userData.phone) : '';
      const response = await http.post('/auth/register', {
        companyName: userData.companyName || userData.businessName || userData.name || `Entreprise ${phone}`,
        name: userData.name,
        phone: userData.phone ? cleanPhone(userData.phone) : undefined,
        email: userData.email || phoneToEmail(phone),
        password: userData.password || pinToPassword(userData.pin)
      });

      const { token, user, tenant } = response.data.data;
      const safeUser = this.persistAuthSession(token, user, tenant);

      return { success: true, user: safeUser };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Erreur lors de l’inscription');
    }
  }

  async loginWithSocial(providerName, options = {}) {
    try {
      this.rememberSocialAuth(providerName, options);
      const provider = this.getSocialProvider(providerName);

      if (options.usePopup !== true) {
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
      const firebaseUser = result?.user || await this.waitForFirebaseUser();

      if (!firebaseUser) {
        return { success: false, pendingRedirect: false };
      }

      const companyName = localStorage.getItem('social_auth_company_name') || undefined;
      return await this.completeFirebaseUser(firebaseUser, companyName);
    } catch (error) {
      this.clearSocialAuthMemory();
      throw new Error(error.response?.data?.message || error.message || 'Connexion sociale impossible');
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
    } catch {
      localStorage.removeItem('auth_token');
      return { valid: false };
    }
  }
}

export const authService = new AuthService();
