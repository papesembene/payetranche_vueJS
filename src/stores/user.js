import { defineStore } from 'pinia';
import { subscriptionPlans, checkLimits, hasFeature } from '../data/subscriptionPlans.js';
import { SessionService } from '../services/session.service.js';

export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,
    isAuthenticated: false,
    loading: false
  }),

  getters: {
    currentPlan: (state) => state.user?.subscription?.plan ? (subscriptionPlans[state.user.subscription.plan] || subscriptionPlans.free) : subscriptionPlans.free,

    subscriptionStatus: (state) => state.user?.subscription || {},

    isSubscriptionActive: (state) => state.user?.subscription?.status === 'active',

    isSubscriptionExpired: (state) => {
      const sub = state.user?.subscription;
      if (!sub) return false;

      // If status is already 'expired', return true
      if (sub.status === 'expired') return true;

      // Check if effective end date has passed
      const endDate = state.effectiveEndDate;
      if (!endDate) return false;

      return new Date(endDate) < new Date();
    },

    isTrialActive: (state) => {
      if (!state.user?.subscription?.trialEnd) return false;
      return new Date(state.user.subscription.trialEnd) > new Date();
    },

    // Date d'expiration effective selon le statut de l'abonnement
    effectiveEndDate: (state) => {
      const sub = state.user?.subscription;
      if (!sub) return null;
      
      // Pour les utilisateurs en période d'essai, utiliser trialEnd
      if (sub.status === 'trial') return sub.trialEnd;
      
      // Pour les autres statuts, utiliser currentPeriodEnd
      return sub.currentPeriodEnd;
    },

    daysUntilExpiry: (state) => {
      const sub = state.user?.subscription;
      if (!sub) return 30;
      
      const endDateStr = sub.status === 'trial' ? sub.trialEnd : sub.currentPeriodEnd;
      if (!endDateStr) return 30;
      
      const endDate = new Date(endDateStr);
      const today = new Date();
      const diffTime = endDate - today;
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // S'assurer que le résultat n'est pas négatif (éviter -1, -2, etc.)
      return Math.max(0, days);
    },

    usageLimits: (state) => state.user?.subscription?.plan ? checkLimits(state.user.subscription.plan, state.user.usage) : { valid: true, violations: [] },

    canAddClient: (state) => {
      // Check subscription status first
      if (!state.isSubscriptionActive) return false;

      if (!state.user?.subscription?.plan) return false;
      const limits = checkLimits(state.user.subscription.plan, state.user.usage);
      return limits.valid || state.user.usage.clients < (subscriptionPlans[state.user.subscription.plan]?.limits.maxClients || 0);
    },

    canAddPayment: (state) => {
      // Check subscription status first
      if (!state.isSubscriptionActive) return false;

      if (!state.user?.subscription?.plan) return false;
      const limits = checkLimits(state.user.subscription.plan, state.user.usage);
      return limits.valid || state.user.usage.payments < (subscriptionPlans[state.user.subscription.plan]?.limits.maxPayments || 0);
    },

    hasFeature: (state) => (feature) => state.user?.subscription?.plan ? hasFeature(state.user.subscription.plan, feature) : false
  },

  actions: {
    // Mise à jour de l'utilisation (lors d'ajout de clients/paiements)
    // Now also persists changes to localStorage and SessionService
    updateUsage(type, increment = 1) {
      if (!this.user) return;
      if (type === 'clients') {
        this.user.usage.clients += increment;
      } else if (type === 'payments') {
        this.user.usage.payments += increment;
      }
      // Persist the updated usage stats to localStorage and SessionService
      this._persistUserData();
    },

    // Helper method to persist user data to localStorage and SessionService
    _persistUserData() {
      if (this.user) {
        localStorage.setItem('user_data', JSON.stringify(this.user));
        localStorage.setItem('auth_user', JSON.stringify(this.user));
        SessionService.saveSession(this.user);
      }
    }
  }
});