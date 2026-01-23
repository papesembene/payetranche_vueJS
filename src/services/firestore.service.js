import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  Timestamp
} from 'firebase/firestore';
import { db } from '../firebase.js';
import { offlineService } from './offline.service.js';

/**
 * Service Firestore pour les opérations de base de données
 * Responsabilités : CRUD générique, requêtes, listeners temps réel
 */
class FirestoreService {
  /**
   * Récupération d'une collection avec filtres
   * @param {string} collectionName - Nom de la collection
   * @param {Object} options - Options { where, orderBy, limit, userId }
   * @returns {Promise<Array>} - Documents de la collection
   */
  async getCollection(collectionName, options = {}) {
    try {
      // Logs uniquement en développement
      if (import.meta.env.DEV) {
        console.log(`🔍 getCollection: ${collectionName}`, options);
      }
      let q = collection(db, collectionName);

      // Appliquer les filtres
      if (options.where) {
        options.where.forEach(condition => {
          q = query(q, where(condition.field, condition.operator, condition.value));
        });
      }

      // Filtre automatique par userId si spécifié
      if (options.userId) {
        if (import.meta.env.DEV) {
          console.log(`👤 Filtrage par userId: ${options.userId}`);
        }
        q = query(q, where('userId', '==', options.userId));
      }

      // Tri
      if (options.orderBy) {
        q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'desc'));
      }

      // Limite
      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      if (import.meta.env.DEV) {
        console.log(`📡 Exécution requête Firestore...`);
      }
      const querySnapshot = await getDocs(q);
      const documents = [];

      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });

      if (import.meta.env.DEV) {
        console.log(`✅ ${documents.length} documents récupérés de ${collectionName}`);
      }

      // Sauvegarder dans IndexedDB pour le mode offline
      if (documents.length > 0 && offlineService) {
        try {
          offlineService.saveData(collectionName, documents);
        } catch (offlineError) {
          console.warn('⚠️ Erreur sauvegarde offline:', offlineError);
        }
      }

      return documents;
    } catch (error) {
      // Erreurs toujours affichées pour le debugging
      console.error(`❌ Erreur Firestore ${collectionName}:`, error);
      throw new Error(`Erreur lors de la récupération de ${collectionName}: ${error.message}`);
    }
  }

  /**
   * Récupération d'un document spécifique
   * @param {string} collectionName - Nom de la collection
   * @param {string} docId - ID du document
   * @returns {Promise<Object>} - Document
   */
  async getDocument(collectionName, docId) {
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      } else {
        throw new Error(`Document ${docId} non trouvé dans ${collectionName}`);
      }
    } catch (error) {
      throw new Error(`Erreur lors de la récupération du document: ${error.message}`);
    }
  }

  /**
   * Création d'un nouveau document
   * @param {string} collectionName - Nom de la collection
   * @param {Object} data - Données du document
   * @returns {Promise<Object>} - Document créé avec ID
   */
  async createDocument(collectionName, data) {
    try {
      // Ajouter timestamps
      const documentData = {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, collectionName), documentData);

      return {
        id: docRef.id,
        ...documentData
      };
    } catch (error) {
      throw new Error(`Erreur lors de la création du document: ${error.message}`);
    }
  }

  /**
   * Mise à jour d'un document
   * @param {string} collectionName - Nom de la collection
   * @param {string} docId - ID du document
   * @param {Object} data - Données à mettre à jour
   * @returns {Promise<Object>} - Document mis à jour
   */
  async updateDocument(collectionName, docId, data) {
    try {
      const docRef = doc(db, collectionName, docId);

      const updateData = {
        ...data,
        updatedAt: Timestamp.now()
      };

      await updateDoc(docRef, updateData);

      // Retourner le document mis à jour
      return await this.getDocument(collectionName, docId);
    } catch (error) {
      throw new Error(`Erreur lors de la mise à jour du document: ${error.message}`);
    }
  }

  /**
   * Suppression d'un document
   * @param {string} collectionName - Nom de la collection
   * @param {string} docId - ID du document
   * @returns {Promise<boolean>} - Succès de la suppression
   */
  async deleteDocument(collectionName, docId) {
    try {
      await deleteDoc(doc(db, collectionName, docId));
      return true;
    } catch (error) {
      throw new Error(`Erreur lors de la suppression du document: ${error.message}`);
    }
  }

  /**
   * Listener temps réel pour une collection
   * @param {string} collectionName - Nom de la collection
   * @param {Object} options - Options de requête
   * @param {Function} callback - Fonction appelée à chaque changement
   * @returns {Function} - Fonction pour arrêter le listener
   */
  listenToCollection(collectionName, options = {}, callback) {
    let q = collection(db, collectionName);

    // Appliquer les filtres
    if (options.where) {
      options.where.forEach(condition => {
        q = query(q, where(condition.field, condition.operator, condition.value));
      });
    }

    if (options.userId) {
      q = query(q, where('userId', '==', options.userId));
    }

    if (options.orderBy) {
      q = query(q, orderBy(options.orderBy.field, options.orderBy.direction || 'desc'));
    }

    if (options.limit) {
      q = query(q, limit(options.limit));
    }

    return onSnapshot(q, (querySnapshot) => {
      const documents = [];
      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });
      callback(documents);
    }, (error) => {
      console.error(`Erreur listener ${collectionName}:`, error);
    });
  }

  /**
   * Recherche de documents
   * @param {string} collectionName - Nom de la collection
   * @param {string} searchField - Champ à rechercher
   * @param {string} searchValue - Valeur à rechercher
   * @param {Object} options - Options supplémentaires
   * @returns {Promise<Array>} - Documents correspondants
   */
  async searchDocuments(collectionName, searchField, searchValue, options = {}) {
    try {
      let q = collection(db, collectionName);

      // Recherche par préfixe (Firestore ne supporte pas les recherches partielles natives)
      q = query(q, where(searchField, '>=', searchValue));
      q = query(q, where(searchField, '<=', searchValue + '\uf8ff'));

      if (options.userId) {
        q = query(q, where('userId', '==', options.userId));
      }

      if (options.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnapshot = await getDocs(q);
      const documents = [];

      querySnapshot.forEach((doc) => {
        documents.push({
          id: doc.id,
          ...doc.data()
        });
      });

      return documents;
    } catch (error) {
      throw new Error(`Erreur lors de la recherche: ${error.message}`);
    }
  }

  /**
   * Opération par lot pour plusieurs documents
   * @param {Array} operations - Tableau d'opérations { type, collection, docId, data }
   * @returns {Promise<void>}
   */
  async batchOperation(operations) {
    try {
      const batch = writeBatch(db);

      operations.forEach(op => {
        const docRef = doc(db, op.collection, op.docId);

        switch (op.type) {
          case 'create':
            batch.set(docRef, {
              ...op.data,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now()
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...op.data,
              updatedAt: Timestamp.now()
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      });

      await batch.commit();
    } catch (error) {
      throw new Error(`Erreur lors de l'opération par lot: ${error.message}`);
    }
  }

  // ==================== PAIEMENTS ====================

  /**
   * Sauvegarder un paiement PayDunya
   * @param {Object} paymentData - Données du paiement
   * @returns {Promise<Object>} - Paiement créé
   */
  async savePayDunyaPayment(paymentData) {
    try {
      const payment = {
        userId: paymentData.userId,
        provider: 'paydunya',
        type: paymentData.type || 'subscription_renewal',
        amount: paymentData.amount,
        currency: paymentData.currency || 'FCFA',
        status: paymentData.status || 'pending',
        invoiceToken: paymentData.invoiceToken,
        subscriptionId: paymentData.subscriptionId,
        planId: paymentData.planId,
        customData: paymentData.customData || {},
        // Ne pas stocker les clés API sensibles
        metadata: {
          description: paymentData.description,
          paymentUrl: paymentData.paymentUrl,
          callbackUrl: paymentData.callbackUrl
        }
      };

      return await this.createDocument('payments', payment);
    } catch (error) {
      throw new Error(`Erreur sauvegarde paiement PayDunya: ${error.message}`);
    }
  }

  /**
   * Sauvegarder un paiement Stripe
   * @param {Object} paymentData - Données du paiement
   * @returns {Promise<Object>} - Paiement créé
   */
  async saveStripePayment(paymentData) {
    try {
      const payment = {
        userId: paymentData.userId,
        provider: 'stripe',
        type: paymentData.type || 'subscription',
        amount: paymentData.amount,
        currency: paymentData.currency || 'fcfa',
        status: paymentData.status || 'pending',
        paymentIntentId: paymentData.paymentIntentId,
        subscriptionId: paymentData.subscriptionId,
        planId: paymentData.planId,
        // Ne pas stocker les client secrets
        metadata: {
          description: paymentData.description,
          couponCode: paymentData.couponCode,
          discount: paymentData.discount
        }
      };

      return await this.createDocument('payments', payment);
    } catch (error) {
      throw new Error(`Erreur sauvegarde paiement Stripe: ${error.message}`);
    }
  }

  /**
   * Mettre à jour le statut d'un paiement
   * @param {string} paymentId - ID du paiement
   * @param {string} status - Nouveau statut
   * @param {Object} additionalData - Données supplémentaires
   * @returns {Promise<Object>} - Paiement mis à jour
   */
  async updatePaymentStatus(paymentId, status, additionalData = {}) {
    try {
      const updateData = {
        status,
        ...additionalData
      };

      // Ajouter timestamp selon le statut
      if (status === 'completed') {
        updateData.completedAt = Timestamp.now();
      } else if (status === 'failed') {
        updateData.failedAt = Timestamp.now();
      }

      return await this.updateDocument('payments', paymentId, updateData);
    } catch (error) {
      throw new Error(`Erreur mise à jour paiement: ${error.message}`);
    }
  }

  /**
   * Récupérer l'historique des paiements d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {Object} filters - Filtres { status, type, limit }
   * @returns {Promise<Array>} - Liste des paiements
   */
  async getUserPayments(userId, filters = {}) {
    try {
      const options = {
        userId,
        orderBy: { field: 'createdAt', direction: 'desc' }
      };

      if (filters.status) {
        options.where = [{ field: 'status', operator: '==', value: filters.status }];
      }

      if (filters.type) {
        const whereConditions = options.where || [];
        whereConditions.push({ field: 'type', operator: '==', value: filters.type });
        options.where = whereConditions;
      }

      if (filters.limit) {
        options.limit = filters.limit;
      }

      return await this.getCollection('payments', options);
    } catch (error) {
      throw new Error(`Erreur récupération paiements: ${error.message}`);
    }
  }

  /**
   * Récupérer un paiement par token (PayDunya)
   * @param {string} invoiceToken - Token de la facture
   * @returns {Promise<Object>} - Paiement trouvé
   */
  async getPaymentByInvoiceToken(invoiceToken) {
    try {
      const payments = await this.getCollection('payments', {
        where: [{ field: 'invoiceToken', operator: '==', value: invoiceToken }]
      });

      if (payments.length === 0) {
        throw new Error('Paiement non trouvé');
      }

      return payments[0];
    } catch (error) {
      throw new Error(`Erreur récupération paiement par token: ${error.message}`);
    }
  }

  /**
   * Récupérer un paiement par PaymentIntent (Stripe)
   * @param {string} paymentIntentId - ID du PaymentIntent
   * @returns {Promise<Object>} - Paiement trouvé
   */
  async getPaymentByPaymentIntent(paymentIntentId) {
    try {
      const payments = await this.getCollection('payments', {
        where: [{ field: 'paymentIntentId', operator: '==', value: paymentIntentId }]
      });

      if (payments.length === 0) {
        throw new Error('Paiement non trouvé');
      }

      return payments[0];
    } catch (error) {
      throw new Error(`Erreur récupération paiement par PaymentIntent: ${error.message}`);
    }
  }

  /**
   * Calculer les statistiques de paiement d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Object>} - Statistiques
   */
  async getPaymentStats(userId) {
    try {
      const payments = await this.getUserPayments(userId);

      const stats = {
        totalPayments: payments.length,
        completedPayments: payments.filter(p => p.status === 'completed').length,
        pendingPayments: payments.filter(p => p.status === 'pending').length,
        failedPayments: payments.filter(p => p.status === 'failed').length,
        totalAmount: payments
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + (p.amount || 0), 0),
        lastPayment: payments.length > 0 ? payments[0] : null
      };

      return stats;
    } catch (error) {
      throw new Error(`Erreur calcul statistiques: ${error.message}`);
    }
  }
}

export const firestoreService = new FirestoreService();