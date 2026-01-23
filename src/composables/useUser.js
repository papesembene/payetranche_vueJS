import { ref, computed, readonly, watch } from 'vue';
import { authService } from '../services/auth.service.js';
import { userService } from '../services/user.service.js';
import { subscriptionService } from '../services/subscription.service.js';
import { useUserStore } from '../stores/user.js';
import { subscriptionPlans as defaultPlans } from '../data/subscriptionPlans.js';

const user = ref(null);
const subscriptionPlans = ref(defaultPlans);
const isAuthenticated = ref(false);
const loading = ref(false);

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
  if (!endDate) return 30;
  
  const today = new Date();
  const diffTime = new Date(endDate) - today;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // S'assurer que le résultat n'est pas négatif (éviter -1, -2, etc.)
  return Math.max(0, days);
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

  // Then check plan limits
  const plan = currentPlan.value;
  if (!plan?.limits || !user.value?.usage) return true;
  return user.value.usage.payments < (plan.limits.maxPayments === -1 ? Infinity : plan.limits.maxPayments);
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

const logout = async () => {
  loading.value = true;
  try {
    await authService.logout();
    user.value = null;
    isAuthenticated.value = false;
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
    console.log('✅ Plans chargés:', Object.keys(plansObject));
  } catch (error) {
    console.error('Erreur chargement plans:', error);
    // Fallback avec les plans par défaut définis dans le composable
    console.log('⚠️ Utilisation des plans par défaut');
  }
};

const loadUser = async () => {
  try {
    const userData = await userService.getProfile();
    user.value = userData;
    isAuthenticated.value = true;
  } catch (error) {
    console.error('Erreur chargement utilisateur:', error);
    user.value = null;
    isAuthenticated.value = false;
    throw error;
  }
};

const updateUsage = (type, increment = 1) => {
  if (type === 'clients') {
    user.value.usage.clients += increment;
  } else if (type === 'payments') {
    user.value.usage.payments += increment;
  }
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
  if (persistedData) {
    try {
      const parsedData = JSON.parse(persistedData);
      user.value = parsedData;
      console.log('✅ Données utilisateur chargées depuis localStorage:', parsedData.name);
    } catch (error) {
      console.warn('Erreur chargement données persistées:', error);
    }
  }
};

// Charger les plans d'abonnement par défaut si nécessaire
const loadDefaultPlansIfNeeded = () => {
  if (Object.keys(subscriptionPlans.value).length === 0) {
    console.log('⚠️ Aucun plan chargé, utilisation des plans par défaut');
    subscriptionPlans.value = defaultPlans;
    console.log('✅ Plans par défaut chargés');
  }
};

// Sauvegarder les données utilisateur dans le localStorage
const persistUserData = () => {
  if (user.value) {
    localStorage.setItem('user_data', JSON.stringify(user.value));
  }
};

// Initialisation automatique au chargement de l'app
const initAuth = async () => {
  const userData = localStorage.getItem('auth_user');
  if (userData) {
    loading.value = true;
    try {
      // Charger d'abord les plans par défaut pour éviter les erreurs d'affichage
      loadDefaultPlansIfNeeded();

      // Charger les données utilisateur depuis localStorage
      const parsedUserData = JSON.parse(userData);
      user.value = parsedUserData;
      isAuthenticated.value = true;

      // Synchroniser avec le userStore
      const userStore = useUserStore();
      userStore.user = parsedUserData;
      userStore.isAuthenticated = true;

      if (import.meta.env.DEV) {
        console.log('✅ Utilisateur chargé depuis localStorage:', parsedUserData.name);
      }
    } catch (error) {
      console.warn('Erreur chargement données utilisateur:', error.message);
      // Données corrompues, nettoyer
      localStorage.removeItem('auth_user');
      localStorage.removeItem('user_data');
      user.value = null;
      isAuthenticated.value = false;
    } finally {
      loading.value = false;
    }
  } else {
    // Pas de données utilisateur, s'assurer que les plans sont disponibles
    loadDefaultPlansIfNeeded();
  }
};

// Watcher pour persister les données utilisateur
watch(user, (newUser) => {
  if (newUser) {
    persistUserData();
  }
}, { deep: true });

// Appeler l'initialisation
initAuth();

export function useUser() {
  return {
    // State
    user,
    subscriptionPlans,
    isAuthenticated,
    loading,

    // Getters
    currentPlan,
    subscriptionStatus,
    isSubscriptionActive,
    isTrialActive,
    effectiveEndDate,
    daysUntilExpiry,
    usageLimits,
    canAddClient,
    canAddPayment,
    hasFeature: hasFeatureCheck,

    // Actions
    register,
    login,
    logout,
    loadUser,
    loadPlans,
    updateProfile,
    updateSubscription,
    cancelSubscription,
    reactivateSubscription,
    updateUsage,
    updateSubscriptionLocally
  };
}