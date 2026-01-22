import { http } from './http.js';

/**
 * Service d'authentification
 * Responsabilités : connexion, inscription, déconnexion, vérification token
 */
class AuthService {
  /**
   * Connexion utilisateur
   * @param {Object} credentials - { phone, otp }
   * @returns {Promise<Object>} - { success, token, user }
   */
  async login(credentials) {
    try {
      // JSON Server - récupération complète des données utilisateur
      const usersResponse = await http.get(`/users?phone=${credentials.phone}`);
      const users = usersResponse.data;

      if (users.length === 0) {
        throw new Error('Utilisateur non trouvé');
      }

      const user = users[0];

      const token = `jwt-token-${user.id}-${Date.now()}`;
      localStorage.setItem('auth_token', token);

      // Retourner toutes les données utilisateur, y compris l'abonnement et l'usage
      return {
        success: true,
        token,
        user: {
          id: user.id,
          phone: user.phone,
          name: user.name,
          avatar: user.avatar,
          createdAt: user.createdAt,
          subscription: user.subscription,
          usage: user.usage
        }
      };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Erreur de connexion');
    }
  }

  /**
   * Inscription nouvel utilisateur
   * @param {Object} userData - { name, phone }
   * @returns {Promise<Object>} - { success, user }
   */
  async register(userData) {
    try {
      // JSON Server - ajout d'utilisateur
      const newUser = {
        id: `user${Date.now()}`,
        name: userData.name,
        phone: userData.phone,
        avatar: userData.name.charAt(0).toUpperCase(),
        createdAt: new Date().toISOString(),
        subscription: {
          id: `sub_${Date.now()}`,
          plan: "free",
          status: "active",
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 jours
          recurringPayment: false,
          paydunyaToken: null
        },
        usage: {
          clients: 0,
          payments: 0,
          totalAmount: 0
        }
      };

      const response = await http.post('/users', newUser);
      return { success: true, user: response.data };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message || 'Erreur d\'inscription');
    }
  }

  /**
   * Déconnexion
   * @returns {Promise<Object>} - { success }
   */
  async logout() {
    try {
      localStorage.removeItem('auth_token');
      // Optionnel : appel API pour invalider le token côté serveur
      // await http.post('/auth/logout');
      return { success: true };
    } catch (error) {
      // Même en cas d'erreur, on supprime le token local
      localStorage.removeItem('auth_token');
      return { success: true };
    }
  }

  /**
   * Vérification du token d'authentification
   * @returns {Promise<Object>} - { valid, user? }
   */
  async verifyToken() {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return { valid: false };
    }

    try {
      const response = await http.get('/auth/verify');
      return { valid: true, user: response.data.user };
    } catch (error) {
      localStorage.removeItem('auth_token');
      return { valid: false };
    }
  }

  /**
   * Rafraîchissement du token
   * @returns {Promise<Object>} - { success, token }
   */
  async refreshToken() {
    try {
      const response = await http.post('/auth/refresh');
      const { token } = response.data;
      localStorage.setItem('auth_token', token);
      return { success: true, token };
    } catch (error) {
      localStorage.removeItem('auth_token');
      throw new Error('Impossible de rafraîchir le token');
    }
  }

  /**
   * Demande de réinitialisation de mot de passe
   * @param {string} email
   * @returns {Promise<Object>} - { success }
   */
  async requestPasswordReset(email) {
    try {
      await http.post('/auth/forgot-password', { email });
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la demande');
    }
  }

  /**
   * Réinitialisation du mot de passe
   * @param {string} token
   * @param {string} newPassword
   * @returns {Promise<Object>} - { success }
   */
  async resetPassword(token, newPassword) {
    try {
      await http.post('/auth/reset-password', { token, password: newPassword });
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la réinitialisation');
    }
  }
}

export const authService = new AuthService();