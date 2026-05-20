import { http } from './http.js';
import { firestoreService } from './firestore.service.js';
import { useUserStore } from '../stores/user.js';

/**
 * Service PayDunya pour les paiements Mobile Money
 * Intégration avec l'API PayDunya pour les renouvellements d'abonnement
 */
class PayDunyaService {
  constructor() {
    // Configuration PayDunya (à définir dans les variables d'environnement)
    this.masterKey = import.meta.env.VITE_PAYDUNYA_MASTER_KEY || 'LEtUwuQw-ZRdY-OI2t-1H4T-sxHAS8VsYzcW';
    this.publicKey = import.meta.env.VITE_PAYDUNYA_PUBLIC_KEY || 'test_public_tsnppBx4SiRi2QYPaQ3Kl3Xsd5d';
    this.privateKey = import.meta.env.VITE_PAYDUNYA_PRIVATE_KEY || 'test_private_AwAeZiCOSqm8TxGga0HMNvF6fh5';
    this.token = import.meta.env.VITE_PAYDUNYA_TOKEN || 'FK4awK78l30yN2kAlWGh';
    this.baseUrl = 'https://app.paydunya.com/api/v1';
  }

  /**
   * Créer une facture de renouvellement d'abonnement
   * @param {Object} subscriptionData - Données de l'abonnement
   * @param {Object} userData - Données utilisateur
   * @returns {Promise<Object>} - URL de paiement et token
   */
  async createSubscriptionInvoice(subscriptionData, userData) {
    try {
      const invoiceData = {
        invoice: {
          items: [
            {
              name: `Renouvellement abonnement ${subscriptionData.plan}`,
              quantity: 1,
              unit_price: subscriptionData.amount,
              total_price: subscriptionData.amount,
              description: `Renouvellement mensuel - ${subscriptionData.plan}`
            }
          ],
          taxes: [],
          total_amount: subscriptionData.amount,
          description: `Renouvellement d'abonnement PayTranche - ${subscriptionData.plan}`,
          callback_url: `${window.location.origin}/payment/callback`,
          return_url: `${window.location.origin}/payment/success`,
          cancel_url: `${window.location.origin}/payment/cancel`
        },
        store: {
          name: 'PayTranche',
          tagline: 'Gestion des paiements échelonnés',
          phone_number: '+221 77 123 45 67',
          postal_address: 'Dakar, Sénégal',
          website_url: window.location.origin
        },
        custom_data: {
          user_id: userData.id,
          subscription_id: subscriptionData.id,
          type: 'subscription_renewal',
          plan: subscriptionData.plan
        }
      };

      // Simulation pour développement (remplacer par vrai appel API)
      if (import.meta.env.DEV) {
        console.log('PayDunya Invoice Data:', invoiceData);
        // Simuler une réponse PayDunya avec URL de test valide
        const invoiceToken = `inv_${Date.now()}`;

        // Sauvegarder le paiement dans Firestore
        try {
          const userStore = useUserStore();
          await firestoreService.savePayDunyaPayment({
            userId: userData.id || userStore.user?.id,
            type: 'subscription_renewal',
            amount: subscriptionData.amount,
            currency: subscriptionData.currency,
            status: 'pending',
            invoiceToken: invoiceToken,
            subscriptionId: subscriptionData.id,
            planId: subscriptionData.plan,
            description: `Renouvellement abonnement ${subscriptionData.plan}`,
            paymentUrl: `http://localhost:5173/payment/success?token=${invoiceToken}&status=completed`,
            callbackUrl: `${window.location.origin}/payment/callback`,
            customData: {
              user_id: userData.id,
              subscription_id: subscriptionData.id,
              type: 'subscription_renewal',
              plan: subscriptionData.plan
            }
          });
          if (import.meta.env.DEV) {
            console.log('✅ Paiement PayDunya sauvegardé dans Firestore');
          }
        } catch (firestoreError) {
          console.error('❌ Erreur sauvegarde Firestore:', firestoreError);
          // Ne pas bloquer le paiement si Firestore échoue
        }

        return {
          success: true,
          invoice_token: invoiceToken,
          payment_url: `http://localhost:5173/payment/success?token=${invoiceToken}&status=completed`,
          response_text: 'Invoice created successfully (simulated)'
        };
      }

      // Appel réel à l'API PayDunya
      const response = await http.post(`${this.baseUrl}/checkout-invoice/create`, invoiceData, {
        headers: {
          'PAYDUNYA-MASTER-KEY': this.masterKey,
          'PAYDUNYA-PRIVATE-KEY': this.privateKey,
          'PAYDUNYA-TOKEN': this.token,
          'Content-Type': 'application/json'
        }
      });

      // Vérifier le code de réponse PayDunya
      if (response.data.response_code !== '00') {
        throw new Error(response.data.response_text || 'Erreur PayDunya lors de la création de la facture');
      }

      // Validation de la réponse PayDunya
      if (!response.data?.response_text?.checkout_url) {
        throw new Error('URL de paiement non reçue de PayDunya');
      }

      if (!response.data?.response_text?.invoice_token) {
        throw new Error('Token de facture non reçu de PayDunya');
      }

      return {
        success: true,
        invoice_token: response.data.response_text.invoice_token,
        payment_url: response.data.response_text.checkout_url,
        response_text: response.data.response_text
      };

    } catch (error) {
      console.error('Erreur PayDunya:', error);
      throw new Error(error.response?.data?.response_text || 'Erreur lors de la création de la facture');
    }
  }

  /**
   * Vérifier le statut d'un paiement
   * @param {string} invoiceToken - Token de la facture
   * @returns {Promise<Object>} - Statut du paiement
   */
  async checkPaymentStatus(invoiceToken) {
    try {
      let paymentData;

      if (import.meta.env.DEV) {
        // Simulation pour développement
        paymentData = {
          success: true,
          status: 'completed',
          amount: 5000,
          custom_data: {
            user_id: 'user123',
            subscription_id: 'sub_123',
            type: 'subscription_renewal'
          }
        };
      } else {
        const response = await http.get(`${this.baseUrl}/checkout-invoice/confirm/${invoiceToken}`, {
          headers: {
            'PAYDUNYA-MASTER-KEY': this.masterKey,
            'PAYDUNYA-PRIVATE-KEY': this.privateKey,
            'PAYDUNYA-TOKEN': this.token
          }
        });

        paymentData = {
          success: response.data.response_code === '00',
          status: response.data.invoice_data.status,
          amount: response.data.invoice_data.total_amount,
          custom_data: response.data.invoice_data.custom_data
        };
      }

      // Mettre à jour le statut dans Firestore
      try {
        const payment = await firestoreService.getPaymentByInvoiceToken(invoiceToken);
        if (payment) {
          await firestoreService.updatePaymentStatus(payment.id, paymentData.status, {
            verifiedAt: new Date(),
            verificationData: paymentData
          });
          if (import.meta.env.DEV) {
            console.log(`✅ Statut paiement mis à jour: ${paymentData.status}`);
          }
        }
      } catch (firestoreError) {
        console.error('❌ Erreur mise à jour Firestore:', firestoreError);
        // Ne pas bloquer la vérification si Firestore échoue
      }

      return paymentData;

    } catch (error) {
      console.error('Erreur vérification paiement:', error);
      throw new Error('Erreur lors de la vérification du paiement');
    }
  }

  /**
   * Traiter un renouvellement d'abonnement
   * @param {string} planId - ID du plan
   * @param {Object} user - Données utilisateur
   * @returns {Promise<Object>} - URL de paiement
   */
  async processSubscriptionRenewal(planId, user) {
    try {
      // Récupérer les détails du plan
      const plans = await this.getAvailablePlans();
      const plan = plans.find(p => p.id === planId);

      if (!plan) {
        throw new Error('Plan non trouvé');
      }

      const subscriptionData = {
        id: `sub_${user.id}_${Date.now()}`,
        plan: planId,
        amount: plan.price,
        currency: plan.currency,
        period: 'monthly'
      };

      const invoiceResult = await this.createSubscriptionInvoice(subscriptionData, user);

      return {
        success: true,
        payment_url: invoiceResult.payment_url,
        invoice_token: invoiceResult.invoice_token,
        amount: plan.price,
        plan: planId
      };

    } catch (error) {
      console.error('Erreur renouvellement:', error);
      throw error;
    }
  }

  /**
   * Récupérer les plans disponibles (pour intégration avec PayDunya)
   * @returns {Promise<Array>} - Liste des plans
   */
  async getAvailablePlans() {
    // En développement, retourner les plans locaux
    // En production, ces plans pourraient être configurés dans PayDunya
    return [
      {
        id: 'free',
        name: 'Gratuit',
        price: 0,
        currency: 'FCFA'
      },
      {
        id: 'essential',
        name: 'Essentiel',
        price: 5000,
        currency: 'FCFA'
      },
      {
        id: 'pro',
        name: 'Pro',
        price: 3000,
        currency: 'FCFA'
      },
      {
        id: 'enterprise',
        name: 'Entreprise',
        price: 50000,
        currency: 'FCFA'
      }
    ];
  }

  /**
   * Configurer un paiement récurrent (webhook)
   * @param {string} planId - ID du plan
   * @param {Object} user - Données utilisateur
   * @returns {Promise<Object>} - Configuration du paiement récurrent
   */
  async setupRecurringPayment(planId, user) {
    try {
      // PayDunya supporte les paiements récurrents via webhooks
      // Cette méthode configure un abonnement récurrent

      const plans = await this.getAvailablePlans();
      const plan = plans.find(p => p.id === planId);

      const recurringData = {
        name: `Abonnement ${plan.name} - PayTranche`,
        amount: plan.price,
        currency: 'XOF',
        period: 'monthly',
        description: `Renouvellement automatique - ${plan.name}`,
        customer: {
          name: user.name,
          email: user.email,
          phone: user.phone || '+221 XX XXX XX XX'
        },
        custom_data: {
          user_id: user.id,
          plan_id: planId,
          type: 'recurring_subscription'
        }
      };

      if (import.meta.env.DEV) {
        console.log('PayDunya Recurring Setup:', recurringData);
        return {
          success: true,
          subscription_token: `recurring_${Date.now()}`,
          message: 'Recurring payment setup simulated'
        };
      }

      // Appel réel à l'API PayDunya pour paiement récurrent
      const response = await http.post(`${this.baseUrl}/recurring-payment/setup`, recurringData, {
        headers: {
          'PAYDUNYA-MASTER-KEY': this.masterKey,
          'PAYDUNYA-PRIVATE-KEY': this.privateKey,
          'PAYDUNYA-TOKEN': this.token,
          'Content-Type': 'application/json'
        }
      });

      return {
        success: true,
        subscription_token: response.data.response_text.subscription_token,
        message: response.data.response_text
      };

    } catch (error) {
      console.error('Erreur configuration paiement récurrent:', error);
      throw new Error('Erreur lors de la configuration du paiement récurrent');
    }
  }

  /**
   * Annuler un paiement récurrent
   * @param {string} subscriptionToken - Token de l'abonnement récurrent
   * @returns {Promise<Object>} - Résultat de l'annulation
   */
  async cancelRecurringPayment(subscriptionToken) {
    try {
      if (import.meta.env.DEV) {
        console.log('PayDunya Recurring Cancel:', subscriptionToken);
        return { success: true, message: 'Recurring payment cancelled (simulated)' };
      }

      const response = await http.delete(`${this.baseUrl}/recurring-payment/${subscriptionToken}`, {
        headers: {
          'PAYDUNYA-MASTER-KEY': this.masterKey,
          'PAYDUNYA-PRIVATE-KEY': this.privateKey,
          'PAYDUNYA-TOKEN': this.token
        }
      });

      return {
        success: true,
        message: response.data.response_text
      };

    } catch (error) {
      console.error('Erreur annulation paiement récurrent:', error);
      throw new Error('Erreur lors de l\'annulation du paiement récurrent');
    }
  }
}

export const payDunyaService = new PayDunyaService();
