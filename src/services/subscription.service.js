import { firestoreService } from './firestore.service.js';
import { auth } from '../firebase.js';

/**
 * Service de gestion des abonnements avec Firestore
 * Responsabilités : plans, création/modification/annulation d'abonnements
 */
class SubscriptionService {
  /**
   * Récupération de tous les plans disponibles
   * @returns {Promise<Array>} - Liste des plans d'abonnement
   */
  async getPlans() {
    try {
      return await firestoreService.getCollection('subscriptionPlans');
    } catch (error) {
      throw new Error('Erreur lors du chargement des plans');
    }
  }

  /**
   * Récupération d'un plan spécifique
   * @param {string} planId - ID du plan
   * @returns {Promise<Object>} - Détails du plan
   */
  async getPlan(planId) {
    try {
      return await firestoreService.getDocument('subscriptionPlans', planId);
    } catch (error) {
      throw new Error('Erreur lors du chargement du plan');
    }
  }

  /**
   * Création d'un nouvel abonnement
   * @param {string} planId - ID du plan choisi
   * @param {string} paymentMethodId - ID de la méthode de paiement (Stripe)
   * @returns {Promise<Object>} - Détails de l'abonnement créé
   */
  async createSubscription(planId, paymentMethodId = null) {
    try {
      const userId = this._getCurrentUserId();
      if (!userId) {
        throw new Error('Utilisateur non authentifié');
      }

      const subscriptionData = {
        userId,
        plan: planId,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: 'sub_mock_' + Date.now()
      };

      const subscription = await firestoreService.createDocument('subscriptions', subscriptionData);
      return { success: true, subscription };
    } catch (error) {
      throw new Error('Erreur lors de la création de l\'abonnement');
    }
  }

  /**
   * Récupération de l'ID utilisateur actuel depuis Firebase Auth
   * @returns {string} - ID utilisateur
   */
  _getCurrentUserId() {
    try {
      const userData = localStorage.getItem('auth_user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Récupération de l'abonnement actif de l'utilisateur
   * @returns {Promise<Object>} - Détails de l'abonnement
   */
  async getCurrentSubscription() {
    try {
      const userId = this._getCurrentUserId();
      if (!userId) {
        return null;
      }

      const subscriptions = await firestoreService.getCollection('subscriptions', {
        userId,
        orderBy: { field: 'createdAt', direction: 'desc' },
        limit: 1
      });

      return subscriptions[0] || null;
    } catch (error) {
      throw new Error('Erreur lors du chargement de l\'abonnement');
    }
  }


  /**
   * Mise à jour de l'abonnement (changement de plan)
   * @param {string} newPlanId - ID du nouveau plan
   * @returns {Promise<Object>} - Abonnement mis à jour
   */
  async updateSubscription(newPlanId) {
    try {
      const currentSub = await this.getCurrentSubscription();
      if (!currentSub) {
        throw new Error('Aucun abonnement trouvé');
      }

      const updateData = {
        plan: newPlanId
      };

      return await firestoreService.updateDocument('subscriptions', currentSub.id, updateData);
    } catch (error) {
      throw new Error('Erreur lors de la mise à jour de l\'abonnement');
    }
  }

  /**
   * Annulation de l'abonnement
   * @param {boolean} cancelAtPeriodEnd - Annuler à la fin de la période (true) ou immédiatement (false)
   * @returns {Promise<Object>} - Abonnement annulé
   */
  async cancelSubscription(cancelAtPeriodEnd = true) {
    try {
      const currentSub = await this.getCurrentSubscription();
      if (!currentSub) {
        throw new Error('Aucun abonnement trouvé');
      }

      const updateData = {
        cancelAtPeriodEnd,
        cancelledAt: new Date().toISOString()
      };

      return await firestoreService.updateDocument('subscriptions', currentSub.id, updateData);
    } catch (error) {
      throw new Error('Erreur lors de l\'annulation de l\'abonnement');
    }
  }

  /**
   * Réactivation de l'abonnement annulé
   * @returns {Promise<Object>} - Abonnement réactivé
   */
  async reactivateSubscription() {
    try {
      const currentSub = await this.getCurrentSubscription();
      if (!currentSub) {
        throw new Error('Aucun abonnement trouvé');
      }

      const updateData = {
        cancelAtPeriodEnd: false,
        status: 'active',
        reactivatedAt: new Date().toISOString()
      };

      return await firestoreService.updateDocument('subscriptions', currentSub.id, updateData);
    } catch (error) {
      throw new Error('Erreur lors de la réactivation de l\'abonnement');
    }
  }

  /**
   * Historique de facturation
   * @param {Object} filters - Filtres { startDate, endDate, limit }
   * @returns {Promise<Object>} - Historique des paiements
   */
  async getBillingHistory(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await http.get(`/user/billing-history?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de l\'historique');
    }
  }

  /**
   * Calcul du coût de changement de plan
   * @param {string} currentPlanId - Plan actuel
   * @param {string} newPlanId - Nouveau plan
   * @returns {Promise<Object>} - Détails du coût
   */
  async calculatePlanChange(currentPlanId, newPlanId) {
    try {
      const [currentPlan, newPlan] = await Promise.all([
        this.getPlan(currentPlanId),
        this.getPlan(newPlanId)
      ]);

      const priceDifference = newPlan.price - currentPlan.price;
      const proratedAmount = Math.max(0, priceDifference); // Simplifié

      return {
        currentPlan,
        newPlan,
        priceDifference,
        proratedAmount,
        immediateCharge: proratedAmount > 0
      };
    } catch (error) {
      throw new Error('Erreur lors du calcul du changement de plan');
    }
  }

  /**
   * Validation des limites d'abonnement
   * @param {string} planId - ID du plan
   * @param {Object} usage - Utilisation actuelle { clients, payments, totalAmount }
   * @returns {Promise<Object>} - { valid, violations }
   */
  async validateLimits(planId, usage) {
    try {
      const plan = await this.getPlan(planId);
      const violations = [];

      if (plan.limits?.maxClients !== -1 && usage.clients > plan.limits.maxClients) {
        violations.push(`Limite de clients dépassée (${usage.clients}/${plan.limits.maxClients})`);
      }

      if (plan.limits?.maxPayments !== -1 && usage.payments > plan.limits.maxPayments) {
        violations.push(`Limite de paiements dépassée (${usage.payments}/${plan.limits.maxPayments})`);
      }

      if (plan.limits?.maxPaymentAmount !== -1 && usage.totalAmount > plan.limits.maxPaymentAmount) {
        violations.push(`Montant maximum dépassé (${usage.totalAmount}/${plan.limits.maxPaymentAmount} FCFA)`);
      }

      return {
        valid: violations.length === 0,
        violations
      };
    } catch (error) {
      throw new Error('Erreur lors de la validation des limites');
    }
  }
}

export const subscriptionService = new SubscriptionService();