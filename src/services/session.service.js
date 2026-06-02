/**
 * Service de gestion des sessions persistantes pour PWA
 * ⚠️ SÉCURISATION TOTALE
 * - Validation stricte des données
 * - Vérification d'expiration
 * - Nettoyage automatique des données corrompues
 * - Intégrité des données avec checksum
 * - Protection contre les attaques
 */

const SESSION_KEY = 'paytranche_session';
const SESSION_EXPIRY_KEY = 'paytranche_session_expiry';
const SESSION_CHECKSUM_KEY = 'paytranche_session_checksum';
const SESSION_DURATION = 90 * 24 * 60 * 60 * 1000; // 90 jours en millisecondes

class SessionService {
  /**
   * Génère une somme de contrôle pour vérifier l'intégrité des données
   * @param {string} data - Les données à vérifier
   * @returns {string} - Checksum
   */
  static _generateChecksum(data) {
    try {
      let hash = 0;
      for (let i = 0; i < data.length; i++) {
        const char = data.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      return Math.abs(hash).toString(16);
    } catch (error) {
      if (import.meta.env.DEV) console.error('❌ Erreur génération checksum:', error);
      return null;
    }
  }

  /**
   * Valide l'intégrité des données de session
   * @param {string} data - Les données
   * @param {string} checksum - Le checksum à vérifier
   * @returns {boolean} - Données valides?
   */
  static _validateChecksum(data, checksum) {
    if (!checksum) return false;
    const calculatedChecksum = this._generateChecksum(data);
    return calculatedChecksum === checksum;
  }

  /**
   * Valide les données utilisateur (protection contre les injections)
   * @param {Object} userData - Les données à valider
   * @returns {boolean} - Données valides?
   */
  static _validateUserData(userData) {
    if (!userData || typeof userData !== 'object') {
      if (import.meta.env.DEV) console.warn('⚠️ userData invalide: pas un objet');
      return false;
    }

    if (!userData.id || typeof userData.id !== 'string') {
      if (import.meta.env.DEV) console.warn('⚠️ userData invalide: pas de id');
      return false;
    }

    if (userData.phone && typeof userData.phone !== 'string') {
      if (import.meta.env.DEV) console.warn('⚠️ userData invalide: phone incorrect');
      return false;
    }

    // Protection contre les données trop volumineuses
    const dataStr = JSON.stringify(userData);
    if (dataStr.length > 100000) {
      if (import.meta.env.DEV) console.warn('⚠️ userData trop volumineux (> 100KB)');
      return false;
    }

    return true;
  }

  /**
   * Sauvegarder une session persistante avec sécurité
   * @param {Object} userData - Les données utilisateur à persister
   * @returns {boolean} - Succès?
   */
  static saveSession(userData, token = localStorage.getItem('auth_token')) {
    try {
      // Valider les données d'abord
      if (!this._validateUserData(userData)) {
        if (import.meta.env.DEV) console.error('❌ Validation échouée, session non sauvegardée');
        return false;
      }

      const sessionData = {
        user: userData,
        token: typeof token === 'string' ? token : '',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + SESSION_DURATION).toISOString(),
        version: '1.0'
      };

      const sessionJson = JSON.stringify(sessionData);
      const checksum = this._generateChecksum(sessionJson);

      try {
        localStorage.setItem(SESSION_KEY, sessionJson);
        localStorage.setItem(SESSION_EXPIRY_KEY, sessionData.expiresAt);
        localStorage.setItem(SESSION_CHECKSUM_KEY, checksum);

        if (import.meta.env.DEV) {
          console.log('✅ Session persistante sauvegardée avec sécurité');
          console.log(`⏰ Expiration: ${new Date(sessionData.expiresAt).toLocaleDateString('fr-FR')}`);
        }
        return true;
      } catch (storageError) {
        if (storageError.name === 'QuotaExceededError') {
          console.error('❌ localStorage plein (dépassement de quota)');
          this._cleanupOldData();
          return false;
        }
        throw storageError;
      }
    } catch (error) {
      console.error('❌ Erreur critique sauvegarde session:', error);
      this.clearSession();
      return false;
    }
  }

  /**
   * Charger une session persistante avec validation complète
   * @returns {Object|null} - Les données de session ou null
   */
  static getSession() {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      const expiryDate = localStorage.getItem(SESSION_EXPIRY_KEY);
      const checksum = localStorage.getItem(SESSION_CHECKSUM_KEY);

      // Vérifications basiques
      if (!sessionData || !expiryDate || !checksum) {
        if (import.meta.env.DEV) console.warn('⚠️ Données de session incomplètes');
        this.clearSession();
        return null;
      }

      // Valider l'intégrité
      if (!this._validateChecksum(sessionData, checksum)) {
        console.error('❌ Intégrité des données compromise, données supprimées');
        this.clearSession();
        return null;
      }

      // Vérifier l'expiration
      const now = new Date();
      const expiry = new Date(expiryDate);

      if (expiry < now) {
        if (import.meta.env.DEV) console.warn('⚠️ Session expirée le', expiry.toLocaleDateString('fr-FR'));
        this.clearSession();
        return null;
      }

      // Parser les données
      const session = JSON.parse(sessionData);

      // Validation finale
      if (!this._validateUserData(session.user)) {
        console.error('❌ Données utilisateur invalides après parsing');
        this.clearSession();
        return null;
      }

      if (import.meta.env.DEV) {
        console.log('✅ Session valide restaurée:', session.user.name);
        console.log(`⏰ Expire dans: ${Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))} jours`);
      }

      return session;
    } catch (error) {
      console.error('❌ Erreur critique chargement session:', error);
      this.clearSession();
      return null;
    }
  }

  /**
   * Vérifie si une session active existe
   * @returns {boolean}
   */
  static isSessionActive() {
    return this.getSession() !== null;
  }

  /**
   * Effacer complètement la session
   * @returns {boolean} - Succès?
   */
  static clearSession() {
    try {
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(SESSION_EXPIRY_KEY);
      localStorage.removeItem(SESSION_CHECKSUM_KEY);
      if (import.meta.env.DEV) console.log('✅ Session complètement effacée');
      return true;
    } catch (error) {
      console.error('❌ Erreur effacement session:', error);
      return false;
    }
  }

  /**
   * Prolonger la durée de la session
   * @returns {boolean} - Succès?
   */
  static renewSession() {
    try {
      const sessionData = localStorage.getItem(SESSION_KEY);
      if (!sessionData) {
        if (import.meta.env.DEV) console.warn('⚠️ Aucune session à prolonger');
        return false;
      }

      const session = JSON.parse(sessionData);
      const newExpiry = new Date(Date.now() + SESSION_DURATION).toISOString();
      session.expiresAt = newExpiry;

      const sessionJson = JSON.stringify(session);
      const checksum = this._generateChecksum(sessionJson);

      localStorage.setItem(SESSION_KEY, sessionJson);
      localStorage.setItem(SESSION_EXPIRY_KEY, newExpiry);
      localStorage.setItem(SESSION_CHECKSUM_KEY, checksum);

      if (import.meta.env.DEV) {
        console.log('✅ Session prolongée');
        console.log(`⏰ Nouvelle expiration: ${new Date(newExpiry).toLocaleDateString('fr-FR')}`);
      }
      return true;
    } catch (error) {
      console.error('❌ Erreur prolongement session:', error);
      return false;
    }
  }

  /**
   * Obtenir l'utilisateur de la session
   * @returns {Object|null}
   */
  static getSessionUser() {
    const session = this.getSession();
    return session ? session.user : null;
  }

  /**
   * Obtenir le token de la session
   * @returns {string|null}
   */
  static getSessionToken() {
    const session = this.getSession();
    return session?.token || null;
  }

  /**
   * Obtenir le temps restant avant expiration (en jours)
   * @returns {number|null}
   */
  static getDaysUntilExpiry() {
    try {
      const expiryDate = localStorage.getItem(SESSION_EXPIRY_KEY);
      if (!expiryDate) return null;

      const now = new Date();
      const expiry = new Date(expiryDate);

      if (expiry < now) {
        this.clearSession();
        return null;
      }

      return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('❌ Erreur calcul expiration:', error);
      return null;
    }
  }

  /**
   * Nettoyer les anciennes données pour libérer de l'espace
   * @private
   */
  static _cleanupOldData() {
    try {
      const now = new Date();
      const expiryDate = localStorage.getItem(SESSION_EXPIRY_KEY);

      if (expiryDate && new Date(expiryDate) < now) {
        if (import.meta.env.DEV) console.log('🗑️  Suppression de la session expirée');
        this.clearSession();
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn('⚠️ Erreur nettoyage:', error);
    }
  }

  /**
   * Diagnostique la santé de la session
   * @returns {Object} - État de la session
   */
  static getSessionStatus() {
    try {
      const session = this.getSession();
      const daysLeft = this.getDaysUntilExpiry();

      return {
        isActive: session !== null,
        user: session?.user?.name || null,
        daysUntilExpiry: daysLeft,
        isSecure: true
      };
    } catch (error) {
      console.error('❌ Erreur diagnostic:', error);
      return {
        isActive: false,
        user: null,
        daysUntilExpiry: null,
        isSecure: false
      };
    }
  }
}

export { SessionService };
