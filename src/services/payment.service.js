import { http, USE_MOCK } from './http.js';
import { firestoreService } from './firestore.service.js';
import { useUserStore } from '../stores/user.js';

/**
 * Service de gestion des paiements
 * Responsabilités : intégration Stripe, traitement des paiements
 */
class PaymentService {
  /**
   * Création d'une intention de paiement Stripe
   * @param {string} planId - ID du plan à payer
   * @param {Object} options - Options supplémentaires { quantity, coupon }
   * @returns {Promise<Object>} - { clientSecret, amount, currency }
   */
  async createPaymentIntent(planId, options = {}) {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockData = {
        clientSecret: 'pi_mock_secret_' + Date.now(),
        amount: 5000,
        currency: 'fcfa',
        planId,
        paymentIntentId: 'pi_mock_' + Date.now()
      };

      // Sauvegarder le paiement dans Firestore
      try {
        const userStore = useUserStore();
        await firestoreService.saveStripePayment({
          userId: userStore.user?.id,
          type: 'subscription',
          amount: mockData.amount,
          currency: mockData.currency,
          status: 'pending',
          paymentIntentId: mockData.paymentIntentId,
          planId: planId,
          description: `Abonnement ${planId}`,
          couponCode: options.coupon,
          discount: options.discount
        });
        console.log('✅ Paiement Stripe sauvegardé dans Firestore');
      } catch (firestoreError) {
        console.error('❌ Erreur sauvegarde Firestore:', firestoreError);
        // Ne pas bloquer le paiement si Firestore échoue
      }

      return mockData;
    }

    try {
      const response = await http.post('/payment/create-intent', {
        planId,
        ...options
      });

      // Sauvegarder le paiement dans Firestore
      try {
        const userStore = useUserStore();
        await firestoreService.saveStripePayment({
          userId: userStore.user?.id,
          type: 'subscription',
          amount: response.data.amount,
          currency: response.data.currency,
          status: 'pending',
          paymentIntentId: response.data.paymentIntentId,
          planId: planId,
          description: `Abonnement ${planId}`,
          couponCode: options.coupon,
          discount: options.discount
        });
        console.log('✅ Paiement Stripe sauvegardé dans Firestore');
      } catch (firestoreError) {
        console.error('❌ Erreur sauvegarde Firestore:', firestoreError);
        // Ne pas bloquer le paiement si Firestore échoue
      }

      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création du paiement');
    }
  }

  /**
   * Confirmation du paiement après succès Stripe
   * @param {string} paymentIntentId - ID de l'intention de paiement Stripe
   * @param {string} planId - ID du plan acheté
   * @returns {Promise<Object>} - { success, subscription }
   */
  async confirmPayment(paymentIntentId, planId) {
    if (USE_MOCK) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockData = {
        success: true,
        subscription: {
          id: 'sub_' + Date.now(),
          plan: planId,
          status: 'active'
        }
      };

      // Mettre à jour le statut dans Firestore
      try {
        const payment = await firestoreService.getPaymentByPaymentIntent(paymentIntentId);
        if (payment) {
          await firestoreService.updatePaymentStatus(payment.id, 'completed', {
            subscriptionId: mockData.subscription.id,
            confirmedAt: new Date()
          });
          console.log('✅ Statut paiement Stripe mis à jour: completed');
        }
      } catch (firestoreError) {
        console.error('❌ Erreur mise à jour Firestore:', firestoreError);
        // Ne pas bloquer la confirmation si Firestore échoue
      }

      return mockData;
    }

    try {
      const response = await http.post('/payment/confirm', {
        paymentIntentId,
        planId
      });

      // Mettre à jour le statut dans Firestore
      try {
        const payment = await firestoreService.getPaymentByPaymentIntent(paymentIntentId);
        if (payment) {
          await firestoreService.updatePaymentStatus(payment.id, 'completed', {
            subscriptionId: response.data.subscription?.id,
            confirmedAt: new Date()
          });
          console.log('✅ Statut paiement Stripe mis à jour: completed');
        }
      } catch (firestoreError) {
        console.error('❌ Erreur mise à jour Firestore:', firestoreError);
        // Ne pas bloquer la confirmation si Firestore échoue
      }

      return response.data;
    } catch (error) {
      // En cas d'erreur, marquer le paiement comme échoué dans Firestore
      try {
        const payment = await firestoreService.getPaymentByPaymentIntent(paymentIntentId);
        if (payment) {
          await firestoreService.updatePaymentStatus(payment.id, 'failed', {
            error: error.message,
            failedAt: new Date()
          });
        }
      } catch (firestoreError) {
        console.error('❌ Erreur mise à jour statut failed:', firestoreError);
      }

      throw new Error(error.response?.data?.message || 'Erreur lors de la confirmation du paiement');
    }
  }

  /**
   * Récupération des méthodes de paiement sauvegardées
   * @returns {Promise<Array>} - Liste des méthodes de paiement
   */
  async getPaymentMethods() {
    try {
      const response = await http.get('/payment/methods');
      return response.data;
    } catch (error) {
      // Retourner un tableau vide si l'endpoint n'existe pas encore
      return [];
    }
  }

  /**
   * Ajout d'une nouvelle méthode de paiement
   * @param {string} paymentMethodId - ID de la méthode Stripe
   * @returns {Promise<Object>} - Méthode de paiement créée
   */
  async addPaymentMethod(paymentMethodId) {
    try {
      const response = await http.post('/payment/methods', {
        paymentMethodId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'ajout de la méthode de paiement');
    }
  }

  /**
   * Suppression d'une méthode de paiement
   * @param {string} paymentMethodId - ID de la méthode à supprimer
   * @returns {Promise<Object>} - { success }
   */
  async removePaymentMethod(paymentMethodId) {
    try {
      const response = await http.delete(`/payment/methods/${paymentMethodId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression de la méthode de paiement');
    }
  }

  /**
   * Définition de la méthode de paiement par défaut
   * @param {string} paymentMethodId - ID de la méthode par défaut
   * @returns {Promise<Object>} - { success }
   */
  async setDefaultPaymentMethod(paymentMethodId) {
    try {
      const response = await http.put('/payment/methods/default', {
        paymentMethodId
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la définition de la méthode par défaut');
    }
  }

  /**
   * Calcul du montant proraté pour changement de plan
   * @param {string} currentPlanId - Plan actuel
   * @param {string} newPlanId - Nouveau plan
   * @returns {Promise<Object>} - Détails du calcul proraté
   */
  async calculateProratedAmount(currentPlanId, newPlanId) {
    try {
      const response = await http.post('/payment/calculate-prorated', {
        currentPlanId,
        newPlanId
      });
      return response.data;
    } catch (error) {
      // Calcul simplifié côté client si l'API n'est pas disponible
      return {
        proratedAmount: 0,
        description: 'Calcul non disponible'
      };
    }
  }

  /**
   * Traitement d'un remboursement
   * @param {string} subscriptionId - ID de l'abonnement
   * @param {number} amount - Montant à rembourser
   * @param {string} reason - Raison du remboursement
   * @returns {Promise<Object>} - Détails du remboursement
   */
  async processRefund(subscriptionId, amount, reason) {
    try {
      const response = await http.post('/payment/refund', {
        subscriptionId,
        amount,
        reason
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du traitement du remboursement');
    }
  }

  /**
   * Récupération de l'historique des transactions
   * @param {Object} filters - Filtres { startDate, endDate, type, limit }
   * @returns {Promise<Array>} - Liste des transactions
   */
  async getTransactionHistory(filters = {}) {
    try {
      // Essayer d'abord Firestore
      const userStore = useUserStore();
      if (userStore.user?.id) {
        try {
          const payments = await firestoreService.getUserPayments(userStore.user.id, filters);
          console.log(`✅ ${payments.length} paiements récupérés depuis Firestore`);
          return payments;
        } catch (firestoreError) {
          console.warn('❌ Erreur Firestore, fallback vers API:', firestoreError.message);
          // Fallback vers l'API si Firestore échoue
        }
      }

      // Fallback vers l'API backend
      const params = new URLSearchParams(filters);
      const response = await http.get(`/payment/transactions?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de l\'historique');
    }
  }

  /**
   * Validation d'un coupon de réduction
   * @param {string} couponCode - Code du coupon
   * @param {string} planId - ID du plan (optionnel)
   * @returns {Promise<Object>} - Détails du coupon { valid, discount, description }
   */
  async validateCoupon(couponCode, planId = null) {
    try {
      const response = await http.post('/payment/validate-coupon', {
        couponCode,
        planId
      });
      return response.data;
    } catch (error) {
      return {
        valid: false,
        error: error.response?.data?.message || 'Coupon invalide'
      };
    }
  }

  /**
   * Application d'un coupon à un paiement
   * @param {string} couponCode - Code du coupon
   * @param {number} amount - Montant original
   * @returns {Promise<Object>} - Montant avec réduction
   */
  async applyCoupon(couponCode, amount) {
    try {
      const validation = await this.validateCoupon(couponCode);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Calcul de la réduction (simplifié)
      let discountedAmount = amount;
      if (validation.discountType === 'percentage') {
        discountedAmount = amount * (1 - validation.discount / 100);
      } else if (validation.discountType === 'fixed') {
        discountedAmount = Math.max(0, amount - validation.discount);
      }

      return {
        originalAmount: amount,
        discountedAmount: Math.round(discountedAmount),
        discount: amount - discountedAmount,
        coupon: validation
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de l\'application du coupon');
    }
  }
}

export const paymentService = new PaymentService();