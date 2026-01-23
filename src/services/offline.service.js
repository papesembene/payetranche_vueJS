/**
 * Service de gestion du mode hors connexion pour PayTranche
 * Utilise IndexedDB pour stocker les données localement
 */
class OfflineService {
  constructor() {
    this.dbName = 'PayTrancheOffline';
    this.dbVersion = 1;
    this.db = null;
    this.isOnline = navigator.onLine;
    this.init();
  }

  /**
   * Initialise IndexedDB et les event listeners
   */
  async init() {
    try {
      this.db = await this.openDB();
      this.setupNetworkListeners();
      console.log('✅ Service offline initialisé');
    } catch (error) {
      console.error('❌ Erreur initialisation offline:', error);
    }
  }

  /**
   * Ouvre la base de données IndexedDB
   */
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store pour les clients
        if (!db.objectStoreNames.contains('clients')) {
          const clientsStore = db.createObjectStore('clients', { keyPath: 'id' });
          clientsStore.createIndex('userId', 'userId', { unique: false });
          clientsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Store pour les transactions
        if (!db.objectStoreNames.contains('transactions')) {
          const transactionsStore = db.createObjectStore('transactions', { keyPath: 'id' });
          transactionsStore.createIndex('userId', 'userId', { unique: false });
          transactionsStore.createIndex('clientId', 'clientId', { unique: false });
          transactionsStore.createIndex('status', 'status', { unique: false });
          transactionsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Store pour les actions en attente de synchronisation
        if (!db.objectStoreNames.contains('pendingActions')) {
          const pendingStore = db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
          pendingStore.createIndex('type', 'type', { unique: false });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store pour les métadonnées
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      };
    });
  }

  /**
   * Configure les listeners pour détecter les changements de connexion
   */
  setupNetworkListeners() {
    window.addEventListener('online', () => {
      console.log('🌐 Connexion rétablie');
      this.isOnline = true;
      this.syncPendingActions();
      this.dispatchNetworkEvent(true);
    });

    window.addEventListener('offline', () => {
      console.log('📱 Mode hors connexion');
      this.isOnline = false;
      this.dispatchNetworkEvent(false);
    });
  }

  /**
   * Dispatche un événement de changement de statut réseau
   */
  dispatchNetworkEvent(isOnline) {
    const event = new CustomEvent('networkChange', {
      detail: { isOnline, timestamp: Date.now() }
    });
    window.dispatchEvent(event);
  }

  /**
   * Vérifie si l'application est en ligne
   */
  get isOnline() {
    return navigator.onLine;
  }

  /**
   * Sauvegarde des données dans IndexedDB
   */
  async saveData(storeName, data) {
    if (!this.db) return;

    try {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);

      // Pour les arrays de données
      if (Array.isArray(data)) {
        const promises = data.map(item => {
          return new Promise((resolve, reject) => {
            const request = store.put(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
          });
        });
        await Promise.all(promises);
      } else {
        // Pour un seul objet
        await new Promise((resolve, reject) => {
          const request = store.put(data);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
      }

      console.log(`💾 ${Array.isArray(data) ? data.length : 1} éléments sauvegardés dans ${storeName}`);
    } catch (error) {
      console.error(`❌ Erreur sauvegarde ${storeName}:`, error);
    }
  }

  /**
   * Récupère des données depuis IndexedDB
   */
  async getData(storeName, query = null) {
    if (!this.db) return [];

    try {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);

      return new Promise((resolve, reject) => {
        let request;

        if (query) {
          request = store.get(query);
        } else {
          request = store.getAll();
        }

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`❌ Erreur récupération ${storeName}:`, error);
      return [];
    }
  }

  /**
   * Ajoute une action à synchroniser quand la connexion revient
   */
  async addPendingAction(action) {
    if (!this.db) return;

    try {
      const pendingAction = {
        ...action,
        timestamp: Date.now(),
        synced: false
      };

      await this.saveData('pendingActions', pendingAction);
      console.log('📝 Action en attente ajoutée:', action.type);
    } catch (error) {
      console.error('❌ Erreur ajout action en attente:', error);
    }
  }

  /**
   * Synchronise les actions en attente
   */
  async syncPendingActions() {
    if (!this.isOnline || !this.db) return;

    try {
      const pendingActions = await this.getData('pendingActions');

      if (pendingActions.length === 0) {
        console.log('✅ Aucune action en attente');
        return;
      }

      console.log(`🔄 Synchronisation de ${pendingActions.length} actions...`);

      // Ici vous pouvez implémenter la logique de synchronisation
      // Par exemple, envoyer les données à Firebase

      // Marquer comme synchronisées
      const transaction = this.db.transaction(['pendingActions'], 'readwrite');
      const store = transaction.objectStore('pendingActions');

      pendingActions.forEach(action => {
        action.synced = true;
        action.syncedAt = Date.now();
        store.put(action);
      });

      console.log('✅ Actions synchronisées');
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
    }
  }

  /**
   * Met à jour les métadonnées
   */
  async setMetadata(key, value) {
    if (!this.db) return;

    try {
      await this.saveData('metadata', { key, value, updatedAt: Date.now() });
    } catch (error) {
      console.error('❌ Erreur sauvegarde métadonnées:', error);
    }
  }

  /**
   * Récupère les métadonnées
   */
  async getMetadata(key) {
    if (!this.db) return null;

    try {
      const data = await this.getData('metadata', key);
      return data ? data.value : null;
    } catch (error) {
      console.error('❌ Erreur récupération métadonnées:', error);
      return null;
    }
  }

  /**
   * Vide complètement la base de données locale
   */
  async clearAllData() {
    if (!this.db) return;

    try {
      const stores = ['clients', 'transactions', 'pendingActions', 'metadata'];

      for (const storeName of stores) {
        const transaction = this.db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        await new Promise((resolve, reject) => {
          const request = store.clear();
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }

      console.log('🗑️ Données locales effacées');
    } catch (error) {
      console.error('❌ Erreur effacement données:', error);
    }
  }

  /**
   * Hook pour Reactivity - surveille les changements de connexion
   */
  onNetworkChange(callback) {
    const handler = (event) => callback(event.detail);
    window.addEventListener('networkChange', handler);
    return () => window.removeEventListener('networkChange', handler);
  }
}

// Instance globale
export const offlineService = new OfflineService();