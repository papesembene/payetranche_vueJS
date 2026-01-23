import { ref, computed, onMounted, onUnmounted } from 'vue';
import { offlineService } from '../services/offline.service.js';

/**
 * Composable pour gérer l'état hors connexion
 */
export function useOffline() {
  const isOnline = ref(navigator.onLine);
  const isLoading = ref(false);
  const lastSyncTime = ref(null);
  const pendingActionsCount = ref(0);

  // État calculé
  const connectionStatus = computed(() => {
    if (isOnline.value) {
      return {
        status: 'online',
        message: 'Connecté',
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      };
    } else {
      return {
        status: 'offline',
        message: 'Hors ligne',
        color: 'text-orange-600',
        bgColor: 'bg-orange-100'
      };
    }
  });

  const canSync = computed(() => {
    return isOnline.value && pendingActionsCount.value > 0;
  });

  // Gestionnaire d'événement pour les changements de réseau
  const handleNetworkChange = (event) => {
    isOnline.value = event.isOnline;

    if (event.isOnline) {
      // Connexion rétablie - synchroniser
      syncData();
    } else {
      // Passé hors ligne
      console.log('📱 Mode hors ligne activé');
    }
  };

  // Synchroniser les données
  const syncData = async () => {
    if (!isOnline.value) return;

    try {
      isLoading.value = true;
      console.log('🔄 Synchronisation des données...');

      await offlineService.syncPendingActions();

      lastSyncTime.value = new Date();
      updatePendingActionsCount();

      console.log('✅ Synchronisation terminée');
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
    } finally {
      isLoading.value = false;
    }
  };

  // Mettre à jour le compteur d'actions en attente
  const updatePendingActionsCount = async () => {
    try {
      const pendingActions = await offlineService.getData('pendingActions');
      pendingActionsCount.value = pendingActions.filter(action => !action.synced).length;
    } catch (error) {
      console.error('❌ Erreur comptage actions:', error);
    }
  };

  // Forcer la synchronisation
  const forceSync = async () => {
    if (!isOnline.value) {
      alert('Connexion requise pour la synchronisation');
      return;
    }

    await syncData();
  };

  // Nettoyer les données locales
  const clearLocalData = async () => {
    if (confirm('Êtes-vous sûr de vouloir effacer toutes les données locales ? Cette action est irréversible.')) {
      try {
        await offlineService.clearAllData();
        lastSyncTime.value = null;
        pendingActionsCount.value = 0;
        console.log('🗑️ Données locales effacées');
      } catch (error) {
        console.error('❌ Erreur effacement:', error);
      }
    }
  };

  // Vérifier la disponibilité du service worker
  const isServiceWorkerAvailable = computed(() => {
    return 'serviceWorker' in navigator;
  });

  // Vérifier si l'app est installée comme PWA
  const isPWAInstalled = computed(() => {
    return window.matchMedia('(display-mode: standalone)').matches ||
           window.navigator.standalone === true;
  });

  // Lifecycle
  onMounted(() => {
    // Écouter les changements de réseau
    const cleanup = offlineService.onNetworkChange(handleNetworkChange);

    // Mettre à jour le compteur initial
    updatePendingActionsCount();

    // Cleanup function
    onUnmounted(cleanup);
  });

  return {
    // État
    isOnline,
    isLoading,
    lastSyncTime,
    pendingActionsCount,
    connectionStatus,
    canSync,
    isServiceWorkerAvailable,
    isPWAInstalled,

    // Actions
    syncData,
    forceSync,
    clearLocalData,
    updatePendingActionsCount
  };
}