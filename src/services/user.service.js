import { http } from './http.js';

/**
 * Service de gestion des utilisateurs
 * Responsabilités : profil utilisateur, préférences, statistiques
 */
class UserService {
  /**
   * Récupération du profil utilisateur complet
   * @param {string} userId - ID de l'utilisateur (optionnel, sinon depuis token)
   * @returns {Promise<Object>} - Données utilisateur avec abonnement et usage
   */
  async getProfile(userId = null) {
    try {
      // Essayer de récupérer l'ID depuis le token ou utiliser celui fourni
      const targetUserId = userId || this._getUserIdFromToken();

      if (!targetUserId) {
        throw new Error('Utilisateur non authentifié');
      }

      const response = await http.get(`/users/${targetUserId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement du profil');
    }
  }

  /**
   * Extraction de l'ID utilisateur depuis le token JWT (simplifié)
   * @returns {string|null} - ID utilisateur ou null
   */
  _getUserIdFromToken() {
    // En production, décoder le JWT pour extraire l'userId
    // Pour l'instant, on utilise une logique simple basée sur les tokens mock
    const token = localStorage.getItem('auth_token');
    if (!token) return null;

    // Simulation : extraire l'ID depuis le token mock
    // Pattern: jwt-token-{userId}-{timestamp}
    const tokenParts = token.split('-');
    if (tokenParts.length >= 3 && tokenParts[0] === 'jwt' && tokenParts[1] === 'token') {
      return tokenParts[2]; // userId est la 3ème partie
    }

    // Fallback pour les anciens tokens
    if (token.includes('user123')) return 'user123';
    if (token.includes('user456')) return 'user456';
    if (token.includes('user1767023258025')) return 'user1767023258025';

    return null;
  }

  /**
   * Mise à jour du profil utilisateur
   * @param {Object} profileData - Données à mettre à jour
   * @returns {Promise<Object>} - Profil mis à jour
   */
  async updateProfile(profileData) {
    try {
      const userId = this._getUserIdFromToken();
      if (!userId) {
        throw new Error('Utilisateur non authentifié');
      }

      const response = await http.patch(`/users/${userId}`, profileData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du profil');
    }
  }

  /**
   * Changement de mot de passe
   * @param {Object} passwordData - { currentPassword, newPassword }
   * @returns {Promise<Object>} - { success }
   */
  async changePassword(passwordData) {
    try {
      const response = await http.put('/user/change-password', passwordData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du changement de mot de passe');
    }
  }

  /**
   * Mise à jour de l'avatar
   * @param {File} avatarFile - Fichier image
   * @returns {Promise<Object>} - { avatarUrl }
   */
  async updateAvatar(avatarFile) {
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);

      const response = await http.post('/user/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour de l\'avatar');
    }
  }

  /**
   * Suppression du compte utilisateur
   * @param {string} password - Mot de passe de confirmation
   * @returns {Promise<Object>} - { success }
   */
  async deleteAccount(password) {
    try {
      const response = await http.delete('/user/account', {
        data: { password }
      });
      localStorage.removeItem('auth_token');
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression du compte');
    }
  }

  /**
   * Récupération des statistiques utilisateur
   * @param {Object} filters - Filtres optionnels { startDate, endDate, type }
   * @returns {Promise<Object>} - Statistiques détaillées
   */
  async getStatistics(filters = {}) {
    try {
      const params = new URLSearchParams(filters);
      const response = await http.get(`/user/statistics?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des statistiques');
    }
  }

  /**
   * Export des données utilisateur
   * @returns {Promise<Blob>} - Fichier de données
   */
  async exportData() {
    try {
      const response = await http.get('/user/export', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'export des données');
    }
  }

  /**
   * Mise à jour des préférences utilisateur
   * @param {Object} preferences - Préférences { language, timezone, notifications, etc. }
   * @returns {Promise<Object>} - Préférences mises à jour
   */
  async updatePreferences(preferences) {
    try {
      const response = await http.put('/user/preferences', preferences);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour des préférences');
    }
  }

  /**
   * Récupération des préférences utilisateur
   * @returns {Promise<Object>} - Préférences utilisateur
   */
  async getPreferences() {
    try {
      const response = await http.get('/user/preferences');
      return response.data;
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