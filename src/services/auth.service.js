import { db } from '../firebase.js';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Service d'authentification simplifiée
 * Responsabilités : connexion directe par numéro de téléphone
 */
class AuthService {
  /**
   * Connexion directe par numéro de téléphone
   * @param {Object} credentials - { phone }
   * @returns {Promise<Object>} - { success, user }
   */
  async login(credentials) {
    try {
      const phoneNumber = credentials.phone;

      // Validation du numéro
      if (!this._validatePhoneNumber(phoneNumber)) {
        throw new Error('Numéro de téléphone invalide');
      }

      // Récupérer ou créer l'utilisateur
      const userData = await this._getOrCreateUserData(phoneNumber);

      // Sauvegarder localement
      localStorage.setItem('auth_user', JSON.stringify(userData));

      return {
        success: true,
        user: userData
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur de connexion');
    }
  }

  /**
   * Inscription d'un nouvel utilisateur
   * @param {Object} userData - { name, phone }
   * @returns {Promise<Object>} - { success, user }
   */
  async register(userData) {
    try {
      const phoneNumber = userData.phone;

      // Validation du numéro
      if (!this._validatePhoneNumber(phoneNumber)) {
        throw new Error('Numéro de téléphone invalide');
      }

      // Créer ou récupérer l'utilisateur
      const userDataComplete = await this._getOrCreateUserData(phoneNumber, userData.name);

      // Sauvegarder localement
      localStorage.setItem('auth_user', JSON.stringify(userDataComplete));

      return {
        success: true,
        user: userDataComplete
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur lors de l\'inscription');
    }
  }

  /**
   * Déconnexion
   * @returns {Promise<Object>} - { success }
   */
  async logout() {
    try {
      // Nettoyer les données locales
      localStorage.removeItem('auth_user');
      return { success: true };
    } catch (error) {
      return { success: true };
    }
  }

  /**
   * Vérification du token d'authentification
   * @returns {Promise<Object>} - { valid, user? }
   */
  async verifyToken() {
    try {
      const userData = localStorage.getItem('auth_user');
      if (!userData) {
        return { valid: false };
      }

      const user = JSON.parse(userData);
      return { valid: true, user };
    } catch (error) {
      localStorage.removeItem('auth_user');
      return { valid: false };
    }
  }

  /**
   * Mise à jour du profil utilisateur
   * @param {Object} profileData - Données à mettre à jour
   * @returns {Promise<Object>} - Profil mis à jour
   */
  async updateProfile(profileData) {
    try {
      const currentUser = JSON.parse(localStorage.getItem('auth_user') || '{}');
      if (!currentUser.id) {
        throw new Error('Utilisateur non connecté');
      }

      const updatedUser = { ...currentUser, ...profileData };

      // Mettre à jour Firestore
      await setDoc(doc(db, 'users', currentUser.id), updatedUser, { merge: true });

      // Mettre à jour localStorage
      localStorage.setItem('auth_user', JSON.stringify(updatedUser));

      return updatedUser;
    } catch (error) {
      throw new Error('Erreur lors de la mise à jour du profil');
    }
  }

  /**
   * Validation du numéro de téléphone sénégalais
   * @param {string} phoneNumber - Numéro à valider
   * @returns {boolean} - true si valide
   */
  _validatePhoneNumber(phoneNumber) {
    if (!phoneNumber || phoneNumber.trim() === '') {
      return false;
    }

    // Nettoyer le numéro (supprimer les espaces et le préfixe pays)
    const cleaned = phoneNumber.replace(/\s+/g, '').replace(/^\+221/, '').replace(/^221/, '');

    // Vérifier le format sénégalais
    // Les préfixes valides sont: 70, 71, 75, 76, 77, 78 (opérateurs: Orange, Sonatel, etc)
    const validPrefixes = ['70', '71', '75', '76', '77', '78'];
    
    // Le numéro doit avoir exactement 9 chiffres et commencer par un préfixe valide
    return cleaned.length === 9 && validPrefixes.some(prefix => cleaned.startsWith(prefix));
  }

  /**
   * Récupération ou création des données utilisateur dans Firestore
   * @param {string} phoneNumber - Numéro de téléphone
   * @param {string} name - Nom de l'utilisateur (optionnel)
   * @returns {Promise<Object>} - Données utilisateur complètes
   */
  async _getOrCreateUserData(phoneNumber, name = null) {
    try {
      // Chercher l'utilisateur par numéro de téléphone
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', phoneNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Utilisateur existe
        const userDoc = querySnapshot.docs[0];
        return {
          id: userDoc.id,
          ...userDoc.data()
        };
      } else {
        // Créer un nouvel utilisateur
        const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const defaultUserData = {
          id: userId,
          phone: phoneNumber,
          name: name || `Utilisateur ${phoneNumber.slice(-4)}`,
          avatar: phoneNumber.slice(-1).toUpperCase(),
          createdAt: new Date().toISOString(),
          subscription: {
            id: `sub_${Date.now()}`,
            plan: "free",
            status: "active",
            currentPeriodStart: new Date().toISOString(),
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
            trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            recurringPayment: false,
            paydunyaToken: null
          },
          usage: {
            clients: 0,
            payments: 0,
            totalAmount: 0
          }
        };

        await setDoc(doc(db, 'users', userId), defaultUserData);
        return defaultUserData;
      }
    } catch (error) {
      throw new Error('Erreur récupération données utilisateur');
    }
  }
}

export const authService = new AuthService();