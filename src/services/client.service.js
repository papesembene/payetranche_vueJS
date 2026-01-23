import { firestoreService } from './firestore.service.js';
import { auth } from '../firebase.js';

/**
 * Service de gestion des clients avec Firestore
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
      const userId = this._getCurrentUserId();
      if (!userId) {
        throw new Error('Utilisateur non authentifié');
      }

      let queryOptions = { userId };

      // Appliquer les filtres
      if (filters.status) {
        queryOptions.where = [{
          field: 'status',
          operator: '==',
          value: filters.status
        }];
      }

      if (filters.limit) {
        queryOptions.limit = filters.limit;
      }

      // Tri par défaut
      queryOptions.orderBy = { field: 'createdAt', direction: 'desc' };

      const clients = await firestoreService.getCollection('clients', queryOptions);

      // Filtrage côté client pour la recherche si nécessaire
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        return clients.filter(client =>
          client.name?.toLowerCase().includes(searchTerm) ||
          client.phone?.includes(searchTerm) ||
          client.address?.toLowerCase().includes(searchTerm)
        );
      }

      return clients;
    } catch (error) {
      throw new Error('Erreur lors du chargement des clients');
    }
  }

  /**
   * Récupération d'un client spécifique
   * @param {string} clientId - ID du client
   * @returns {Promise<Object>} - Détails du client
   */
  async getClient(clientId) {
    try {
      return await firestoreService.getDocument('clients', clientId);
    } catch (error) {
      throw new Error('Erreur lors du chargement du client');
    }
  }

  /**
   * Création d'un nouveau client
   * @param {Object} clientData - Données du client
   * @returns {Promise<Object>} - Client créé
   */
  async createClient(clientData) {
    try {
      const userId = this._getCurrentUserId();
      if (!userId) {
        throw new Error('Utilisateur non authentifié');
      }

      const clientDoc = {
        ...clientData,
        userId,
        status: 'active',
        totalDebt: clientData.totalDebt || 0,
        lastPayment: null
      };

      return await firestoreService.createDocument('clients', clientDoc);
    } catch (error) {
      throw new Error('Erreur lors de la création du client');
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
      return await firestoreService.updateDocument('clients', clientId, clientData);
    } catch (error) {
      throw new Error('Erreur lors de la mise à jour du client');
    }
  }

  /**
   * Suppression d'un client
   * @param {string} clientId - ID du client
   * @returns {Promise<Object>} - { success }
   */
  async deleteClient(clientId) {
    try {
      await firestoreService.deleteDocument('clients', clientId);
      return { success: true };
    } catch (error) {
      throw new Error('Erreur lors de la suppression du client');
    }
  }

  /**
   * Recherche de clients
   * @param {string} query - Terme de recherche
   * @returns {Promise<Array>} - Clients correspondants
   */
  async searchClients(query) {
    try {
      const userId = this._getCurrentUserId();
      if (!userId) {
        throw new Error('Utilisateur non authentifié');
      }

      // Recherche dans Firestore (limitée aux champs indexés)
      return await firestoreService.searchDocuments('clients', 'name', query, { userId });
    } catch (error) {
      throw new Error('Erreur lors de la recherche');
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

export const clientService = new ClientService();