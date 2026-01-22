import { http } from './http.js';

/**
 * Service de gestion des transactions/paiements
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
      const params = new URLSearchParams({
        userId: this._getCurrentUserId(),
        ...filters
      });
      const response = await http.get(`/transactions?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des transactions');
    }
  }

  /**
   * Récupération d'une transaction spécifique
   * @param {string} transactionId - ID de la transaction
   * @returns {Promise<Object>} - Détails de la transaction
   */
  async getTransaction(transactionId) {
    try {
      const response = await http.get(`/transactions/${transactionId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de la transaction');
    }
  }

  /**
   * Création d'une nouvelle transaction
   * @param {Object} transactionData - Données de la transaction
   * @returns {Promise<Object>} - Transaction créée
   */
  async createTransaction(transactionData) {
    try {
      const response = await http.post('/transactions', {
        ...transactionData,
        userId: this._getCurrentUserId(),
        createdAt: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de la transaction');
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
      const response = await http.patch(`/transactions/${transactionId}`, transactionData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour de la transaction');
    }
  }

  /**
   * Suppression d'une transaction
   * @param {string} transactionId - ID de la transaction
   * @returns {Promise<Object>} - { success }
   */
  async deleteTransaction(transactionId) {
    try {
      await http.delete(`/transactions/${transactionId}`);
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression de la transaction');
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
      const today = new Date().toISOString().split('T')[0];
      const transactions = await this.getTransactions({
        status: 'pending',
        dueDate_lte: today
      });
      return transactions;
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

      const stats = {
        total: transactions.length,
        completed: transactions.filter(t => t.status === 'completed').length,
        pending: transactions.filter(t => t.status === 'pending').length,
        overdue: transactions.filter(t => t.status === 'pending' && new Date(t.dueDate) < new Date()).length,
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
   * Récupération de l'ID utilisateur actuel
   * @returns {string} - ID utilisateur
   */
  _getCurrentUserId() {
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    // Token format: jwt-token-{userId}-{timestamp}
    const parts = token.split('-');
    if (parts.length >= 3 && parts[0] === 'jwt' && parts[1] === 'token') {
      return parts[2];
    }

    // Fallback pour compatibilité
    if (token.includes('user123')) return 'user123';
    if (token.includes('user456')) return 'user456';
    return null;
  }
}

export const transactionService = new TransactionService();