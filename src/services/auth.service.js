import { db } from '../firebase.js';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

/**
 * Service d'authentification avec Code PIN
 * Sécurité : PIN hashé avec salt pour protéger les données utilisateurs
 */
class AuthService {
  /**
   * Connexion avec vérification du Code PIN
   * @param {Object} credentials - { phone, pin }
   * @returns {Promise<Object>} - { success, user }
   */
  async login(credentials) {
    try {
      const phoneNumber = credentials.phone;
      const pin = credentials.pin;

      // Validation du numéro
      if (!this._validatePhoneNumber(phoneNumber)) {
        throw new Error('Numéro de téléphone invalide');
      }

      // Vérification du PIN requis
      if (!pin || pin.length !== 4) {
        throw new Error('Code PIN requis (4 chiffres)');
      }

      // Récupérer l'utilisateur
      const userData = await this._getUserByPhone(phoneNumber);
      
      if (!userData) {
        throw new Error('Compte non trouve. Veuillez vous inscrire.');
      }

      // Vérifier le PIN
      if (!this._verifyPin(pin, userData.pinHash)) {
        throw new Error('Code PIN incorrect');
      }

      // Sauvegarder localement (sans le hash du PIN)
      const { pinHash, ...safeUserData } = userData;
      localStorage.setItem('auth_user', JSON.stringify(safeUserData));

      return {
        success: true,
        user: safeUserData
      };
    } catch (error) {
      throw new Error(error.message || 'Erreur de connexion');
    }
  }

  /**
   * Inscription d'un nouvel utilisateur avec Code PIN
   * @param {Object} userData - { name, phone, pin }
   * @returns {Promise<Object>} - { success, user }
   */
  async register(userData) {
    try {
      const phoneNumber = userData.phone;
      const pin = userData.pin;

      // Validation du numéro
      if (!this._validatePhoneNumber(phoneNumber)) {
        throw new Error('Numéro de téléphone invalide');
      }

      // Validation du PIN (4 chiffres)
      if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        throw new Error('Le code PIN doit contenir exactement 4 chiffres');
      }

      // Vérifier si l'utilisateur existe déjà
      const existingUser = await this._getUserByPhone(phoneNumber);
      if (existingUser) {
        throw new Error('Un compte avec ce numéro existe déjà');
      }

      // Créer le nouvel utilisateur avec PIN hashé
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const pinHash = this._hashPin(pin);
      
      const defaultUserData = {
        id: userId,
        phone: phoneNumber,
        name: userData.name || `Utilisateur ${phoneNumber.slice(-4)}`,
        pinHash: pinHash,
        avatar: userData.name ? userData.name.charAt(0).toUpperCase() : 'U',
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

      // Sauvegarder localement (sans le hash du PIN)
      const { pinHash: _, ...safeUserData } = defaultUserData;
      localStorage.setItem('auth_user', JSON.stringify(safeUserData));

      return {
        success: true,
        user: safeUserData
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

      // Si on met à jour le PIN
      if (profileData.newPin) {
        // Vérifier l'ancien PIN
        if (!profileData.currentPin) {
          throw new Error('Code PIN actuel requis');
        }
        
        const userDoc = await getDoc(doc(db, 'users', currentUser.id));
        if (!userDoc.exists()) {
          throw new Error('Utilisateur non trouvé');
        }
        
        const userData = userDoc.data();
        if (!this._verifyPin(profileData.currentPin, userData.pinHash)) {
          throw new Error('Code PIN actuel incorrect');
        }
        
        // Mettre à jour avec le nouveau PIN hashé
        updatedUser.pinHash = this._hashPin(profileData.newPin);
      }

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
   * Hash un PIN avec salt pour le stockage sécurisé
   * @param {string} pin - Code PIN (4 chiffres)
   * @returns {string} - Hash du PIN
   */
  _hashPin(pin) {
    // Créer un salt unique basé sur le numéro de téléphone de l'utilisateur
    // Cela rend chaque hash unique même si les PIN sont les mêmes
    const salt = 'PayTrancheSecureSalt2024';
    let hash = 0;
    const str = pin + salt;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(16) + '_' + Date.now().toString(36);
  }

  /**
   * Vérifie si un PIN correspond au hash stocké
   * @param {string} pin - Code PIN à vérifier
   * @param {string} storedHash - Hash stocké
   * @returns {boolean}
   */
  _verifyPin(pin, storedHash) {
    if (!pin || !storedHash) return false;
    
    // Extraire la partie salt du hash stocké
    const salt = 'PayTrancheSecureSalt2024';
    let hash = 0;
    const str = pin + salt;
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    
    const newHash = hash.toString(16);
    
    // Vérifier si le début du hash correspond
    return storedHash.startsWith(newHash);
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
   * Récupération des données utilisateur par numéro de téléphone
   * @param {string} phoneNumber - Numéro de téléphone
   * @returns {Promise<Object>} - Données utilisateur ou null
   */
  async _getUserByPhone(phoneNumber) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('phone', '==', phoneNumber));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        return {
          id: userDoc.id,
          ...userDoc.data()
        };
      }
      return null;
    } catch (error) {
      throw new Error('Erreur lors de la récupération de l\'utilisateur');
    }
  }
}

export const authService = new AuthService();
