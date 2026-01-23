import { firestoreService } from './firestore.service.js';
import { auth } from '../firebase.js';

/**
 * Service de gestion des transactions/paiements avec Firestore
 * Responsabilités : CRUD transactions, historique, statistiques
 */
class TransactionService {
  /**
   * Récupération des transactions de l'utilisateur
   * @param {Object} filters - Filtres { status, type, clientId, startDate, endDate, limit, offset }
   * @returns {Promise<Array>} - Liste des transactions
   */
  async getTransactions(filters = {}) {
    try {
      const userId = this._getCurrentUserId();
      if (!userId) {
        throw new Error('Utilisateur non authentifié');
      }

      let queryOptions = { userId };
      let whereConditions = [];

      // Appliquer les filtres
      if (filters.status) {
        whereConditions.push({
          field: 'status',
          operator: '==',
          value: filters.status
        });
      }

      if (filters.type) {
        whereConditions.push({
          field: 'type',
          operator: '==',
          value: filters.type
        });
      }

      if (filters.clientId) {
        whereConditions.push({
          field: 'clientId',
          operator: '==',
          value: filters.clientId
        });
      }

      if (filters.startDate) {
        whereConditions.push({
          field: 'createdAt',
          operator: '>=',
          value: filters.startDate
        });
      }

      if (filters.endDate) {
        whereConditions.push({
          field: 'createdAt',
          operator: '<=',
          value: filters.endDate
        });
      }

      if (whereConditions.length > 0) {
        queryOptions.where = whereConditions;
      }

      if (filters.limit) {
        queryOptions.limit = filters.limit;
      }

      // Tri par défaut
      queryOptions.orderBy = { field: 'createdAt', direction: 'desc' };

      return await firestoreService.getCollection('transactions', queryOptions);
    } catch (error) {
      throw new Error('Erreur lors du chargement des transactions');
    }
  }

  /**
   * Récupération d'une transaction spécifique
   * @param {string} transactionId - ID de la transaction
   * @returns {Promise<Object>} - Détails de la transaction
   */
  async getTransaction(transactionId) {
    try {
      return await firestoreService.getDocument('transactions', transactionId);
    } catch (error) {
      throw new Error('Erreur lors du chargement de la transaction');
    }
  }

  /**
   * Création d'une nouvelle transaction
   * @param {Object} transactionData - Données de la transaction
   * @returns {Promise<Object>} - Transaction créée
   */
  async createTransaction(transactionData) {
    try {
      const userId = this._getCurrentUserId();
      if (!userId) {
        throw new Error('Utilisateur non authentifié');
      }

      const transactionDoc = {
        ...transactionData,
        userId,
        status: transactionData.status || 'pending'
      };

      return await firestoreService.createDocument('transactions', transactionDoc);
    } catch (error) {
      throw new Error('Erreur lors de la création de la transaction');
    }
  }

  /**
   * Mise à jour d'une transaction
   * @param {string} transactionId - ID de la transaction
   * @param {Object} transactionData - Données à mettre à jour
   * @returns {Promise<Object>} - Transaction mise à jour
   */
  async updateTransaction(transactionId, transactionData) {
    try {
      return await firestoreService.updateDocument('transactions', transactionId, transactionData);
    } catch (error) {
      throw new Error('Erreur lors de la mise à jour de la transaction');
    }
  }

  /**
   * Suppression d'une transaction
   * @param {string} transactionId - ID de la transaction
   * @returns {Promise<Object>} - { success }
   */
  async deleteTransaction(transactionId) {
    try {
      await firestoreService.deleteDocument('transactions', transactionId);
      return { success: true };
    } catch (error) {
      throw new Error('Erreur lors de la suppression de la transaction');
    }
  }

  /**
   * Marquage d'une transaction comme payée
   * @param {string} transactionId - ID de la transaction
   * @param {Object} paymentData - Données du paiement { amount, paymentDate }
   * @returns {Promise<Object>} - Transaction mise à jour
   */
  async markAsPaid(transactionId, paymentData = {}) {
    try {
      const updateData = {
        status: 'completed',
        paymentDate: paymentData.paymentDate || new Date().toISOString(),
        ...paymentData
      };
      return await this.updateTransaction(transactionId, updateData);
    } catch (error) {
      throw new Error('Erreur lors du marquage comme payé');
    }
  }

  /**
   * Récupération des transactions en retard
   * @returns {Promise<Array>} - Transactions en retard
   */
  async getOverdueTransactions() {
    try {
      const userId = this._getCurrentUserId();
      if (!userId) {
        throw new Error('Utilisateur non authentifié');
      }

      // Récupérer toutes les transactions pending
      const pendingTransactions = await firestoreService.getCollection('transactions', {
        userId,
        where: [{ field: 'status', operator: '==', value: 'pending' }],
        orderBy: { field: 'createdAt', direction: 'desc' }
      });

      // Filtrer côté client les transactions en retard
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Début de journée

      const overdueTransactions = pendingTransactions.filter(transaction => {
        if (!transaction.dueDate) return false;

        const dueDate = new Date(transaction.dueDate);
        dueDate.setHours(0, 0, 0, 0); // Début de journée

        return dueDate < today;
      });

      return overdueTransactions;
    } catch (error) {
      throw new Error('Erreur lors du chargement des transactions en retard');
    }
  }

  /**
   * Statistiques des transactions
   * @param {Object} dateRange - Plage de dates { startDate, endDate }
   * @returns {Promise<Object>} - Statistiques détaillées
   */
  async getTransactionStats(dateRange = {}) {
    try {
      const transactions = await this.getTransactions(dateRange);

      // Calculer les transactions en retard
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const overdueCount = transactions.filter(t => {
        if (t.status !== 'pending' || !t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        dueDate.setHours(0, 0, 0, 0);
        return dueDate < today;
      }).length;

      const stats = {
        total: transactions.length,
        completed: transactions.filter(t => t.status === 'completed').length,
        pending: transactions.filter(t => t.status === 'pending').length,
        overdue: overdueCount,
        totalAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
        completedAmount: transactions
          .filter(t => t.status === 'completed')
          .reduce((sum, t) => sum + (t.amount || 0), 0),
        pendingAmount: transactions
          .filter(t => t.status === 'pending')
          .reduce((sum, t) => sum + (t.amount || 0), 0)
      };

      return stats;
    } catch (error) {
      throw new Error('Erreur lors du calcul des statistiques');
    }
  }

  /**
   * Transactions par client
   * @param {string} clientId - ID du client
   * @returns {Promise<Array>} - Transactions du client
   */
  async getTransactionsByClient(clientId) {
    try {
      return await this.getTransactions({ clientId });
    } catch (error) {
      throw new Error('Erreur lors du chargement des transactions du client');
    }
  }

  /**
   * Export des transactions
   * @param {Object} filters - Filtres d'export
   * @returns {Promise<Blob>} - Fichier d'export
   */
  async exportTransactions(filters = {}) {
    try {
      const params = new URLSearchParams({ ...filters, export: 'true' });
      const response = await http.get(`/transactions/export?${params}`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error('Erreur lors de l\'export des transactions');
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
}

export const transactionService = new TransactionService();