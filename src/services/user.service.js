import { auth } from '../firebase.js';
import { firestoreService } from './firestore.service.js';

/**
 * Service de gestion des utilisateurs avec Firestore
 * Responsabilités : profil utilisateur, préférences, statistiques
 */
class UserService {
  /**
   * Récupération du profil utilisateur complet
   * @param {string} userId - ID de l'utilisateur (optionnel, sinon utilisateur actuel)
   * @returns {Promise<Object>} - Données utilisateur avec abonnement et usage
   */
  async getProfile(userId = null) {
    try {
      const targetUserId = userId || this._getCurrentUserId();

      if (!targetUserId) {
        throw new Error('Utilisateur non authentifié');
      }

      return await firestoreService.getDocument('users', targetUserId);
    } catch (error) {
      throw new Error('Erreur lors du chargement du profil');
    }
  }

  /**
   * Récupération de l'ID utilisateur actuel depuis Firebase Auth
   * @returns {string|null} - ID utilisateur ou null
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
   * Mise à jour du profil utilisateur
   * @param {Object} profileData - Données à mettre à jour
   * @returns {Promise<Object>} - Profil mis à jour
   */
  async updateProfile(profileData) {
    try {
      const userId = this._getCurrentUserId();
      if (!userId) {
        throw new Error('Utilisateur non authentifié');
      }

      return await firestoreService.updateDocument('users', userId, profileData);
    } catch (error) {
      throw new Error('Erreur lors de la mise à jour du profil');
    }
  }

  /**
   * Mise à jour des statistiques d'usage
   * @param {Object} usageData - Données d'usage à mettre à jour
   * @returns {Promise<Object>} - Profil mis à jour
   */
  async updateUsage(usageData) {
    try {
      const userId = this._getCurrentUserId();
      if (!userId) {
        throw new Error('Utilisateur non authentifié');
      }

      const userProfile = await this.getProfile(userId);
      const updatedUsage = {
        ...userProfile.usage,
        ...usageData
      };

      return await firestoreService.updateDocument('users', userId, { usage: updatedUsage });
    } catch (error) {
      throw new Error('Erreur lors de la mise à jour des statistiques');
    }
  }

  /**
   * Récupération des statistiques utilisateur
   * @param {Object} filters - Filtres optionnels { startDate, endDate, type }
   * @returns {Promise<Object>} - Statistiques détaillées
   */
  async getStatistics(filters = {}) {
    try {
      const userId = this._getCurrentUserId();
      if (!userId) {
        throw new Error('Utilisateur non authentifié');
      }

      // Récupérer les transactions de l'utilisateur
      const transactions = await firestoreService.getCollection('transactions', {
        userId,
        where: filters.startDate ? [{
          field: 'createdAt',
          operator: '>=',
          value: filters.startDate
        }] : [],
        orderBy: { field: 'createdAt', direction: 'desc' }
      });

      // Calculer les statistiques
      const stats = {
        totalTransactions: transactions.length,
        completedTransactions: transactions.filter(t => t.status === 'completed').length,
        pendingTransactions: transactions.filter(t => t.status === 'pending').length,
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
      throw new Error('Erreur lors du chargement des statistiques');
    }
  }

  /**
   * Export des données utilisateur
   * @returns {Promise<Blob>} - Fichier de données
   */
  async exportData() {
    try {
      const userId = this._getCurrentUserId();
      if (!userId) {
        throw new Error('Utilisateur non authentifié');
      }

      // Récupérer toutes les données de l'utilisateur
      const [userProfile, clients, transactions] = await Promise.all([
        this.getProfile(userId),
        firestoreService.getCollection('clients', { userId }),
        firestoreService.getCollection('transactions', { userId })
      ]);

      return {
        user: userProfile,
        clients,
        transactions,
        exportedAt: new Date().toISOString()
      };
    } catch (error) {
      throw new Error('Erreur lors de l\'export des données');
    }
  }

  /**
   * Mise à jour des préférences utilisateur
   * @param {Object} preferences - Préférences { language, timezone, notifications, etc. }
   * @returns {Promise<Object>} - Préférences mises à jour
   */
  async updatePreferences(preferences) {
    try {
      const userId = this._getCurrentUserId();
      if (!userId) {
        throw new Error('Utilisateur non authentifié');
      }

      return await firestoreService.updateDocument('users', userId, { preferences });
    } catch (error) {
      throw new Error('Erreur lors de la mise à jour des préférences');
    }
  }

  /**
   * Récupération des préférences utilisateur
   * @returns {Promise<Object>} - Préférences utilisateur
   */
  async getPreferences() {
    try {
      const userProfile = await this.getProfile();
      return userProfile.preferences || {
        language: 'fr',
        timezone: 'Africa/Dakar',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        theme: 'light'
      };
    } catch (error) {
      // Retourner des préférences par défaut en cas d'erreur
      return {
        language: 'fr',
        timezone: 'Africa/Dakar',
        notifications: {
          email: true,
          push: true,
          sms: false
        },
        theme: 'light'
      };
    }
  }
}

export const userService = new UserService();