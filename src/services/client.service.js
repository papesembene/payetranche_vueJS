import { http } from './http.js';

/**
 * Service de gestion des clients
 * Responsabilités : CRUD clients, recherche, statistiques
 */
class ClientService {
  /**
   * Récupération des clients de l'utilisateur
   * @param {Object} filters - Filtres { status, search, limit, offset }
   * @returns {Promise<Array>} - Liste des clients
   */
  async getClients(filters = {}) {
    try {
      const params = new URLSearchParams({
        userId: this._getCurrentUserId(),
        ...filters
      });
      const response = await http.get(`/clients?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des clients');
    }
  }

  /**
   * Récupération d'un client spécifique
   * @param {string} clientId - ID du client
   * @returns {Promise<Object>} - Détails du client
   */
  async getClient(clientId) {
    try {
      const response = await http.get(`/clients/${clientId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement du client');
    }
  }

  /**
   * Création d'un nouveau client
   * @param {Object} clientData - Données du client
   * @returns {Promise<Object>} - Client créé
   */
  async createClient(clientData) {
    try {
      const response = await http.post('/clients', {
        ...clientData,
        userId: this._getCurrentUserId(),
        status: 'active',
        createdAt: new Date().toISOString()
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création du client');
    }
  }

  /**
   * Mise à jour d'un client
   * @param {string} clientId - ID du client
   * @param {Object} clientData - Données à mettre à jour
   * @returns {Promise<Object>} - Client mis à jour
   */
  async updateClient(clientId, clientData) {
    try {
      const response = await http.patch(`/clients/${clientId}`, clientData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du client');
    }
  }

  /**
   * Suppression d'un client
   * @param {string} clientId - ID du client
   * @returns {Promise<Object>} - { success }
   */
  async deleteClient(clientId) {
    try {
      await http.delete(`/clients/${clientId}`);
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression du client');
    }
  }

  /**
   * Recherche de clients
   * @param {string} query - Terme de recherche
   * @returns {Promise<Array>} - Clients correspondants
   */
  async searchClients(query) {
    try {
      const response = await http.get(`/clients?q=${encodeURIComponent(query)}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la recherche');
    }
  }

  /**
   * Statistiques des clients
   * @returns {Promise<Object>} - Statistiques { total, active, totalDebt, etc. }
   */
  async getClientStats() {
    try {
      const clients = await this.getClients();
      const stats = {
        total: clients.length,
        active: clients.filter(c => c.status === 'active').length,
        inactive: clients.filter(c => c.status === 'inactive').length,
        totalDebt: clients.reduce((sum, c) => sum + (c.totalDebt || 0), 0),
        averageDebt: 0
      };

      if (stats.total > 0) {
        stats.averageDebt = Math.round(stats.totalDebt / stats.total);
      }

      return stats;
    } catch (error) {
      throw new Error('Erreur lors du calcul des statistiques');
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

export const clientService = new ClientService();