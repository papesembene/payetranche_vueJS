import { ref, computed, readonly, watch } from 'vue';
import { authService } from '../services/auth.service.js';
import { userService } from '../services/user.service.js';
import { subscriptionService } from '../services/subscription.service.js';
import { SessionService } from '../services/session.service.js';
import { transactionService } from '../services/transaction.service.js';
import { clientService } from '../services/client.service.js';
import { useUserStore } from '../stores/user.js';
import { subscriptionPlans as defaultPlans } from '../data/subscriptionPlans.js';

const user = ref(null);
const subscriptionPlans = ref(defaultPlans);
const isAuthenticated = ref(false);
const loading = ref(false);
const transactions = ref([]);
const clients = ref([]);

// Getters
const currentPlan = computed(() => {
  if (!user.value?.subscription?.plan || !subscriptionPlans.value[user.value.subscription.plan]) {
    return {};
  }
  return subscriptionPlans.value[user.value.subscription.plan];
});

const subscriptionStatus = computed(() => user.value?.subscription || {});

const isSubscriptionActive = computed(() => user.value?.subscription?.status === 'active');

const isTrialActive = computed(() => {
  if (!user.value?.subscription?.trialEnd) return false;
  return new Date(user.value.subscription.trialEnd) > new Date();
});

// Calcule la date d'expiration effective selon le statut de l'abonnement
const effectiveEndDate = computed(() => {
  const sub = user.value?.subscription;
  if (!sub) return null;
  
  // Pour les utilisateurs en période d'essai, utiliser trialEnd
  if (sub.status === 'trial') return sub.trialEnd;
  
  // Pour les autres statuts, utiliser currentPeriodEnd
  return sub.currentPeriodEnd;
});

const daysUntilExpiry = computed(() => {
  const endDate = effectiveEndDate.value;
  if (!endDate) return 14;
  
  const today = new Date();
  const diffTime = new Date(endDate) - today;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // S'assurer que le résultat n'est pas négatif (éviter -1, -2, etc.)
  return Math.max(0, days);
});

// Compteur dynamique des paiements payés
const dynamicPaymentCount = computed(() => {
  return transactions.value?.filter(t => t.status === 'completed')?.length || 0;
});

// Montant total dynamique des paiements payés
const dynamicTotalAmount = computed(() => {
  return transactions.value
    ?.filter(t => t.status === 'completed')
    ?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
});

// Compteur dynamique des clients
const dynamicClientCount = computed(() => {
  return clients.value?.length || 0;
});

const usageLimits = computed(() => {
  const plan = currentPlan.value;
  if (!plan?.limits || !user.value?.usage) return { valid: true, violations: [] };

  const violations = [];

  if (plan.limits.maxClients !== -1 && user.value.usage.clients > plan.limits.maxClients) {
    violations.push(`Limite de clients dépassée (${user.value.usage.clients}/${plan.limits.maxClients})`);
  }

  if (plan.limits.maxPayments !== -1 && user.value.usage.payments > plan.limits.maxPayments) {
    violations.push(`Limite de paiements dépassée (${user.value.usage.payments}/${plan.limits.maxPayments})`);
  }

  if (plan.limits.maxPaymentAmount !== -1 && user.value.usage.totalAmount > plan.limits.maxPaymentAmount) {
    violations.push(`Montant maximum dépassé (${user.value.usage.totalAmount}/${plan.limits.maxPaymentAmount} FCFA)`);
  }

  return {
    valid: violations.length === 0,
    violations
  };
});

const canAddClient = computed(() => {
  // Check subscription status first
  if (!isSubscriptionActive.value) return false;

  // Then check plan limits
  const plan = currentPlan.value;
  if (!plan?.limits || !user.value?.usage) return true;
  return user.value.usage.clients < (plan.limits.maxClients === -1 ? Infinity : plan.limits.maxClients);
});

const canAddPayment = computed(() => {
  // Check subscription status first
  if (!isSubscriptionActive.value) return false;

  // Then check plan limits using dynamic payment count
  const plan = currentPlan.value;
  if (!plan?.limits) return true;
  return dynamicPaymentCount.value < (plan.limits.maxPayments === -1 ? Infinity : plan.limits.maxPayments);
});

const hasFeatureCheck = (feature) => {
  const plan = currentPlan.value;
  if (!plan?.features) return false;

  if (plan.features.includes(feature)) return true;
  if (plan.features.includes('all_essential') && subscriptionPlans.value.essential?.features?.includes(feature)) return true;
  if (plan.features.includes('all_pro') &&
      (subscriptionPlans.value.pro?.features?.includes(feature) || subscriptionPlans.value.essential?.features?.includes(feature))) return true;

  return false;
};


// Actions
const register = async (userData) => {
  loading.value = true;
  try {
    const result = await authService.register(userData);
    if (result.success) {
      user.value = result.user;
      isAuthenticated.value = true;
      persistUserData(); // Sauvegarder les données après inscription
      localStorage.setItem('auth_user', JSON.stringify(result.user)); // Sauvegarder aussi auth_user
      // Sauvegarder aussi la session persistante pour PWA
      SessionService.saveSession(result.user);
      // Sync with userStore
      const userStore = useUserStore();
      userStore.user = result.user;
      userStore.isAuthenticated = true;
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    loading.value = false;
  }
};

const login = async (credentials) => {
  loading.value = true;
  try {
    const result = await authService.login(credentials);
    if (result.success) {
      user.value = result.user;
      isAuthenticated.value = true;
      persistUserData(); // Sauvegarder les données immédiatement après connexion
      localStorage.setItem('auth_user', JSON.stringify(result.user)); // Sauvegarder aussi auth_user
      // Sauvegarder aussi la session persistante pour PWA
      SessionService.saveSession(result.user);
      // Sync with userStore
      const userStore = useUserStore();
      userStore.user = result.user;
      userStore.isAuthenticated = true;
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    loading.value = false;
  }
};

const socialLogin = async (provider, options = {}) => {
  loading.value = true;
  try {
    const result = await authService.loginWithSocial(provider, options);
    if (result.success && !result.pendingRedirect) {
      user.value = result.user;
      isAuthenticated.value = true;
      persistUserData();
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      SessionService.saveSession(result.user);
      const userStore = useUserStore();
      userStore.user = result.user;
      userStore.isAuthenticated = true;
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    loading.value = false;
  }
};

const googleCredentialLogin = async (idToken, options = {}) => {
  loading.value = true;
  try {
    const result = await authService.loginWithGoogleCredential(idToken, options);
    if (result.success) {
      user.value = result.user;
      isAuthenticated.value = true;
      persistUserData();
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      SessionService.saveSession(result.user);
      const userStore = useUserStore();
      userStore.user = result.user;
      userStore.isAuthenticated = true;
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    loading.value = false;
  }
};

const completeSocialLogin = async () => {
  loading.value = true;
  try {
    const result = await authService.completeSocialRedirect();
    if (result.success) {
      user.value = result.user;
      isAuthenticated.value = true;
      persistUserData();
      localStorage.setItem('auth_user', JSON.stringify(result.user));
      SessionService.saveSession(result.user);
      const userStore = useUserStore();
      userStore.user = result.user;
      userStore.isAuthenticated = true;
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    loading.value = false;
  }
};

const logout = async () => {
  loading.value = true;
  try {
    await authService.logout();
    user.value = null;
    isAuthenticated.value = false;
    // Nettoyer le localStorage
    localStorage.removeItem('auth_user');
    localStorage.removeItem('user_data');
    // Nettoyer la session persistante pour PWA
    SessionService.clearSession();
    // Sync with userStore
    const userStore = useUserStore();
    userStore.user = null;
    userStore.isAuthenticated = false;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    loading.value = false;
  }
};

const updateProfile = async (profileData) => {
  loading.value = true;
  try {
    // Mettre à jour le profil via l'API
    const updatedUser = await userService.updateProfile(profileData);
    // Mettre à jour localement
    if (user.value) {
      user.value.name = updatedUser.name;
      user.value.phone = updatedUser.phone;
    }
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    loading.value = false;
  }
};

const updateSubscription = async (newPlan) => {
  loading.value = true;
  try {
    const result = await subscriptionService.updateSubscription(newPlan);
    if (result.success || result) {
      // Recharger les données utilisateur pour mettre à jour l'abonnement
      await loadUser();
      return { success: true };
    }
    return result;
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    loading.value = false;
  }
};

const cancelSubscription = async () => {
  loading.value = true;
  try {
    const result = await subscriptionService.cancelSubscription();
    // Recharger pour mettre à jour le statut
    await loadUser();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    loading.value = false;
  }
};

const reactivateSubscription = async () => {
  loading.value = true;
  try {
    const result = await subscriptionService.reactivateSubscription();
    // Recharger pour mettre à jour le statut
    await loadUser();
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  } finally {
    loading.value = false;
  }
};

const loadPlans = async () => {
  try {
    const plans = await subscriptionService.getPlans();
    // Convertir le tableau en objet avec les IDs comme clés
    const plansObject = {};
    plans.forEach(plan => {
      plansObject[plan.id] = plan;
    });
    subscriptionPlans.value = plansObject;
    if (import.meta.env.DEV) console.log('✅ Plans chargés:', Object.keys(plansObject));
  } catch (error) {
    console.error('Erreur chargement plans:', error);
    // Fallback avec les plans par défaut définis dans le composable
    if (import.meta.env.DEV) console.log('⚠️ Utilisation des plans par défaut');
  }
};

const loadUser = async () => {
  try {
    const userData = await userService.getProfile();
    user.value = userData;
    isAuthenticated.value = true;
    
    // Charger aussi les transactions et clients pour les compteurs dynamiques
    try {
      const [txns, clientsList] = await Promise.all([
        transactionService.getTransactions(),
        clientService.getClients()
      ]);
      transactions.value = txns || [];
      clients.value = clientsList || [];
    } catch (error) {
      console.warn('⚠️ Erreur chargement données Firestore:', error);
      transactions.value = [];
      clients.value = [];
    }
    
    persistUserData(); // Sauvegarder après chargement
  } catch (error) {
    console.error('Erreur chargement utilisateur:', error);
    user.value = null;
    isAuthenticated.value = false;
    throw error;
  }
};

const updateUsage = (type, increment = 1) => {
  if (!user.value) return;
  
  if (type === 'clients') {
    user.value.usage.clients += increment;
  } else if (type === 'payments') {
    user.value.usage.payments += increment;
  }
  
  // Persist the updated usage stats immediately
  persistUserData();
};

const updateSubscriptionLocally = (updates) => {
  if (user.value) {
    user.value = {
      ...user.value,
      subscription: {
        ...user.value.subscription,
        ...updates
      }
    };
  }
};

// Charger les données utilisateur depuis le localStorage (pour persister les mises à jour)
const loadPersistedUserData = () => {
  const persistedData = localStorage.getItem('user_data');
  const authUser = localStorage.getItem('auth_user');
  
  if (persistedData) {
    try {
      const parsedData = JSON.parse(persistedData);
      user.value = parsedData;
      if (import.meta.env.DEV) console.log('✅ Données utilisateur chargées depuis localStorage:', parsedData.name);
    } catch (error) {
      console.warn('❌ Erreur chargement données persistées:', error);
      localStorage.removeItem('user_data');
    }
  } else if (authUser) {
    // Fallback : charger depuis auth_user si user_data n'existe pas
    try {
      const parsedAuth = JSON.parse(authUser);
      user.value = parsedAuth;
      localStorage.setItem('user_data', JSON.stringify(parsedAuth));
      if (import.meta.env.DEV) console.log('✅ Utilisateur restauré depuis auth_user:', parsedAuth.name);
    } catch (error) {
      console.warn('❌ Erreur chargement auth_user:', error);
      localStorage.removeItem('auth_user');
    }
  }
};

// Charger les plans d'abonnement par défaut si nécessaire
const loadDefaultPlansIfNeeded = () => {
  if (Object.keys(subscriptionPlans.value).length === 0) {
    if (import.meta.env.DEV) console.log('⚠️ Aucun plan chargé, utilisation des plans par défaut');
    subscriptionPlans.value = defaultPlans;
    if (import.meta.env.DEV) console.log('✅ Plans par défaut chargés');
  }
};

// Sauvegarder les données utilisateur dans le localStorage
const persistUserData = () => {
  if (user.value) {
    localStorage.setItem('user_data', JSON.stringify(user.value));
    // Aussi sauvegarder dans la session persistante pour PWA
    SessionService.saveSession(user.value);
  }
};

// Initialisation automatique au chargement de l'app
const initAuth = async () => {
  loading.value = true;
  try {
    // Charger d'abord les plans par défaut pour éviter les erreurs d'affichage
    loadDefaultPlansIfNeeded();
    
    // Charger les données persistées depuis localStorage
    loadPersistedUserData();

    // Essayer de restaurer depuis la session persistante (PWA)
    const persistedSession = SessionService.getSession();

    let userData = localStorage.getItem('auth_user');
    if (!userData && persistedSession) {
      // Si pas de auth_user mais session persistante existe, l'utiliser
      userData = JSON.stringify(persistedSession.user);
      localStorage.setItem('auth_user', userData);
      if (import.meta.env.DEV) console.log('✅ Session PWA restaurée depuis session persistante');
    }

    if (userData) {
      try {
        // Charger les données utilisateur depuis localStorage
        const parsedUserData = JSON.parse(userData);
        user.value = parsedUserData;
        isAuthenticated.value = true;

        // Synchroniser avec le userStore
        const userStore = useUserStore();
        userStore.user = parsedUserData;
        userStore.isAuthenticated = true;

        // Prolonger la session pour PWA
        if (persistedSession) {
          SessionService.renewSession();
        }

        // Valider le token auprès du serveur de manière asynchrone (sans bloquer)
        try {
          const isValid = await authService.verifyToken();
          if (!isValid.valid) {
            if (import.meta.env.DEV) console.warn('⚠️ Token invalide, suppression des données');
            localStorage.removeItem('auth_user');
            localStorage.removeItem('user_data');
            SessionService.clearSession();
            user.value = null;
            isAuthenticated.value = false;
            userStore.user = null;
            userStore.isAuthenticated = false;
          } else {
            if (import.meta.env.DEV) console.log('✅ Token valide, utilisateur restauré:', parsedUserData.name);
          }
        } catch (verifyError) {
          // En cas d'erreur de vérification (offline), on garde la session
          if (import.meta.env.DEV) {
            console.warn('⚠️ Impossible de valider le token (offline)', verifyError.message);
            console.log('✅ Utilisateur maintenu en session (offline mode)');
          }        }

        if (import.meta.env.DEV) {
          console.log('✅ Utilisateur chargé depuis localStorage:', parsedUserData.name);
        }
      } catch (parseError) {
        if (import.meta.env.DEV) console.warn('❌ Erreur parsing données utilisateur:', parseError.message);
        // Données corrompues, nettoyer
        localStorage.removeItem('auth_user');
        localStorage.removeItem('user_data');
        SessionService.clearSession();
        user.value = null;
        isAuthenticated.value = false;
      }
    } else {
      // Pas de données utilisateur en localStorage
      user.value = null;
      isAuthenticated.value = false;
    }
  } catch (error) {
    console.error('❌ Erreur initialisation auth:', error);
    user.value = null;
    isAuthenticated.value = false;
  } finally {
    loading.value = false;
    
    // Synchroniser les comptages réels depuis la base de données
    if (isAuthenticated.value && user.value) {
      syncUsageCounts();
    }
  }
};

// Synchroniser les comptages réels avec la base de données
const syncUsageCounts = async () => {
  try {
    if (!user.value?.id) return;
    
    // Charger les clients et paiements réels depuis Firestore
    const [clientsList, txns] = await Promise.all([
      clientService.getClients(),
      transactionService.getTransactions()
    ]);
    
    // Mettre à jour les refs pour les compteurs dynamiques
    transactions.value = txns || [];
    clients.value = clientsList || [];
    
    // Compter les vrais clients
    const realClientCount = clients.value?.length || 0;
    
    // Compter SEULEMENT les paiements effectués (statut 'completed')
    const completedTransactions = transactions.value?.filter(t => t.status === 'completed') || [];
    const realPaymentCount = completedTransactions.length;
    
    // Calculer le montant total des paiements COMPLÉTÉS uniquement
    const totalAmount = completedTransactions.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    
    // Mettre à jour si différent
    if (user.value.usage) {
      if (user.value.usage.clients !== realClientCount) {
        if (import.meta.env.DEV) console.log(`📊 Synchronisation clients: ${user.value.usage.clients} → ${realClientCount}`);
        user.value.usage.clients = realClientCount;
      }
      
      if (user.value.usage.payments !== realPaymentCount) {
        if (import.meta.env.DEV) console.log(`📊 Synchronisation paiements: ${user.value.usage.payments} → ${realPaymentCount}`);
        user.value.usage.payments = realPaymentCount;
      }
      
      if (user.value.usage.totalAmount !== totalAmount) {
        if (import.meta.env.DEV) console.log(`📊 Synchronisation montant: ${user.value.usage.totalAmount} → ${totalAmount}`);
        user.value.usage.totalAmount = totalAmount;
      }
      
      // Persister les comptages synchronisés
      persistUserData();
    }
    
    // Aussi synchroniser le userStore
    const userStore = useUserStore();
    if (userStore.user?.usage) {
      userStore.user.usage.clients = realClientCount;
      userStore.user.usage.payments = realPaymentCount;
      userStore.user.usage.totalAmount = totalAmount;
    }
  } catch (error) {
    if (import.meta.env.DEV) console.warn('⚠️ Erreur synchronisation usage:', error.message);
  }
};

// Watcher pour persister les données utilisateur
watch(user, (newUser) => {
  if (newUser) {
    persistUserData();
  }
}, { deep: true });

// Initialisation n'est plus appelée automatiquement
// Elle sera appelée depuis App.vue au montage

export function useUser() {
  return {
    // State
    user,
    subscriptionPlans,
    isAuthenticated,
    loading,
    transactions,

    // Getters
    currentPlan,
    subscriptionStatus,
    isSubscriptionActive,
    isTrialActive,
    effectiveEndDate,
    daysUntilExpiry,
    dynamicClientCount,
    dynamicPaymentCount,
    dynamicTotalAmount,
    usageLimits,
    canAddClient,
    canAddPayment,
    hasFeature: hasFeatureCheck,

    // Actions
    register,
    login,
    socialLogin,
    googleCredentialLogin,
    completeSocialLogin,
    logout,
    loadUser,
    loadPlans,
    updateProfile,
    updateSubscription,
    cancelSubscription,
    reactivateSubscription,
    updateUsage,
    updateSubscriptionLocally,
    syncUsageCounts, // Exporter pour synchroniser manuellement si besoin
    initAuth // Exporter initAuth pour être appelé depuis App.vue
  };
}
