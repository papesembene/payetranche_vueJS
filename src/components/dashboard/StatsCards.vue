<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { DollarSign, Check, AlertTriangle, Users } from 'lucide-vue-next';
import { analyticsService } from '../../services/analytics.service.js';

const props = defineProps({
  refresh: {
    type: Number,
    default: 0
  }
});

const stats = ref([]);
const loading = ref(false);
const isRefreshing = ref(false);
const prevStats = ref({
  totalReceivable: 0,
  totalReceived: 0,
  overdueAmount: 0,
  activeClients: 0
});
let refreshInterval = null;

// Watch for refresh prop changes
watch(() => props.refresh, () => {
  loadStats();
});

// Manual refresh function
const refreshStats = () => {
  loadStats();
};

// Auto-refresh every 10 seconds to keep stats up to date
const startAutoRefresh = () => {
  refreshInterval = setInterval(() => {
    loadStats();
  }, 10000); // 10 seconds
};

// Refresh when component becomes visible (user returns to tab/page)
const handleVisibilityChange = () => {
  if (!document.hidden) {
    loadStats();
  }
};

const loadStats = async () => {
  if (loading.value && !isRefreshing.value) return; // Prevent multiple simultaneous calls
  try {
    isRefreshing.value = true;

    const metrics = await analyticsService.getDashboardMetrics();
    const totalReceivable = metrics.remainingToRecover || 0;
    const totalReceived = metrics.totalRecovered || 0;
    const overdueAmount = metrics.overdueAmount || 0;
    const activeClients = metrics.clientsWithDebtCount ?? metrics.activeClientsCount ?? 0;

    const currentStats = {
      totalReceivable,
      totalReceived,
      overdueAmount,
      activeClients
    };

    // Only update if values have changed to avoid unnecessary re-renders
    const hasChanges = Object.keys(currentStats).some(
      key => currentStats[key] !== prevStats.value[key]
    );

    if (hasChanges || stats.value.length === 0) {
      stats.value = [
        {
          title: 'Reste à récupérer',
          value: formatAmount(totalReceivable),
          helper: 'Argent encore dû par les clients',
          icon: DollarSign,
          bgColor: 'bg-teal-100',
          iconColor: 'text-teal-600'
        },
        {
          title: 'Paiements reçus',
          value: formatAmount(totalReceived),
          helper: 'Somme déjà encaissée',
          icon: Check,
          bgColor: 'bg-green-100',
          iconColor: 'text-green-600'
        },
        {
          title: 'En retard',
          value: formatAmount(overdueAmount),
          helper: 'À relancer en priorité',
          icon: AlertTriangle,
          bgColor: 'bg-red-100',
          iconColor: 'text-red-600'
        },
        {
          title: 'Clients avec dette',
          value: activeClients.toString(),
          helper: 'Personnes à suivre',
          icon: Users,
          bgColor: 'bg-amber-100',
          iconColor: 'text-amber-600'
        }
      ];
    }

    // Update previous stats
    prevStats.value = currentStats;
  } catch (error) {
    console.error('Erreur chargement stats:', error);
    // Fallback avec des données vides
    stats.value = [];
  } finally {
    loading.value = false;
    isRefreshing.value = false;
  }
};

const formatAmount = (amount) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M FCFA`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K FCFA`;
  }
  return `${amount} FCFA`;
};

onMounted(() => {
  loadStats();
  startAutoRefresh();
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  if (refreshInterval) {
    clearInterval(refreshInterval);
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<template>
  <!-- Loading State -->
  <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
    <div v-for="i in 4" :key="i" class="bg-white rounded-lg border border-gray-200 p-5">
      <div class="animate-pulse">
        <div class="flex items-start justify-between mb-4">
          <div class="w-14 h-14 bg-gray-200 rounded-xl"></div>
          <div class="w-12 h-4 bg-gray-200 rounded"></div>
        </div>
        <div class="w-20 h-8 bg-gray-200 rounded mb-2"></div>
        <div class="w-16 h-4 bg-gray-200 rounded"></div>
      </div>
    </div>
  </div>

  <!-- Loaded State -->
  <div v-else>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div
        v-for="(stat, index) in stats"
        :key="index"
        class="bg-white rounded-lg border border-gray-200 p-5"
      >
        <div class="flex items-center gap-3 mb-3">
          <div :class="['w-11 h-11 rounded-lg flex items-center justify-center', stat.bgColor]">
            <component :is="stat.icon" :size="22" :class="stat.iconColor" />
          </div>
          <p class="text-sm font-semibold text-gray-600">{{ stat.title }}</p>
        </div>
        <h3 class="text-2xl font-bold text-gray-950">{{ stat.value }}</h3>
        <p class="text-sm text-gray-500 mt-1">{{ stat.helper }}</p>
      </div>
    </div>
  </div>
</template>
