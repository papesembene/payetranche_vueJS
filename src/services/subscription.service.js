import { http } from './http.js';

/**
 * Service de gestion des abonnements
 * Responsabilités : plans, création/modification/annulation d'abonnements
 */
class SubscriptionService {
  /**
   * Récupération de tous les plans disponibles
   * @returns {Promise<Array>} - Liste des plans d'abonnement
   */
  async getPlans() {
    try {
      const response = await http.get('/subscriptionPlans');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des plans');
    }
  }

  /**
   * Récupération d'un plan spécifique
   * @param {string} planId - ID du plan
   * @returns {Promise<Object>} - Détails du plan
   */
  async getPlan(planId) {
    try {
      const response = await http.get(`/subscriptionPlans/${planId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement du plan');
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
      const subscriptionData = {
        userId: this._getCurrentUserId(),
        plan: planId,
        status: 'active',
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        stripeSubscriptionId: 'sub_mock_' + Date.now()
      };

      const response = await http.post('/subscriptions', subscriptionData);
      return { success: true, subscription: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de l\'abonnement');
    }
  }

  _getCurrentUserId() {
    const token = localStorage.getItem('auth_token');
    if (token?.includes('user123')) return 'user123';
    if (token?.includes('user456')) return 'user456';
    return 'user123';
  }

  /**
   * Récupération de l'abonnement actif de l'utilisateur
   * @returns {Promise<Object>} - Détails de l'abonnement
   */
  async getCurrentSubscription() {
    try {
      const userId = this._getCurrentUserId();
      const response = await http.get(`/subscriptions?userId=${userId}`);
      return response.data[0] || null; // Retourner le premier abonnement trouvé
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de l\'abonnement');
    }
  }

  _getCurrentUserId() {
    const token = localStorage.getItem('auth_token');
    if (token?.includes('user123')) return 'user123';
    if (token?.includes('user456')) return 'user456';
    return 'user123';
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
        plan: newPlanId,
        updatedAt: new Date().toISOString()
      };
      const response = await http.patch(`/subscriptions/${currentSub.id}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour de l\'abonnement');
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
      const response = await http.patch(`/subscriptions/${currentSub.id}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'annulation de l\'abonnement');
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
      const response = await http.patch(`/subscriptions/${currentSub.id}`, updateData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la réactivation de l\'abonnement');
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