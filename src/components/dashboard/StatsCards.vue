<script setup>
import { ref, onMounted, watch } from 'vue';
import { DollarSign, Check, AlertTriangle, Users, Download, FileText } from 'lucide-vue-next';
import { clientService } from '../../services/client.service.js';
import { transactionService } from '../../services/transaction.service.js';
import { generateReportPDF } from '../../utils/export.js';

const props = defineProps({
  refresh: {
    type: Number,
    default: 0
  }
});

const stats = ref([]);
const loading = ref(false);
const prevStats = ref({
  totalReceivable: 0,
  totalReceived: 0,
  overdueAmount: 0,
  activeClients: 0
});

// Watch for refresh prop changes
watch(() => props.refresh, () => {
  loadStats();
});

const loadStats = async () => {
  if (loading.value) return; // Prevent multiple simultaneous calls
  try {
    loading.value = true;

    // Charger les données en parallèle
    const [clients, transactions, clientStats, transactionStats] = await Promise.all([
      clientService.getClients(),
      transactionService.getTransactions(),
      clientService.getClientStats(),
      transactionService.getTransactionStats()
    ]);

    // Calculer les statistiques
    const totalReceivable = transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalReceived = transactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const overdueAmount = transactions
      .filter(t => t.status === 'pending' && new Date(t.dueDate) < new Date())
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const currentStats = {
      totalReceivable,
      totalReceived,
      overdueAmount,
      activeClients: clientStats.active
    };

    stats.value = [
      {
        title: 'Total à recevoir',
        value: formatAmount(totalReceivable),
        change: calculateChange(totalReceivable, prevStats.value.totalReceivable),
        isPositive: totalReceivable >= prevStats.value.totalReceivable,
        icon: DollarSign,
        bgColor: 'bg-teal-100',
        iconColor: 'text-teal-600'
      },
      {
        title: 'Paiements reçus',
        value: formatAmount(totalReceived),
        change: calculateChange(totalReceived, prevStats.value.totalReceived),
        isPositive: totalReceived >= prevStats.value.totalReceived,
        icon: Check,
        bgColor: 'bg-green-100',
        iconColor: 'text-green-600'
      },
      {
        title: 'En retard',
        value: formatAmount(overdueAmount),
        change: calculateChange(overdueAmount, prevStats.value.overdueAmount),
        isPositive: overdueAmount <= prevStats.value.overdueAmount, // Less overdue is positive
        icon: AlertTriangle,
        bgColor: 'bg-red-100',
        iconColor: 'text-red-600'
      },
      {
        title: 'Clients actifs',
        value: clientStats.active.toString(),
        change: calculateChange(clientStats.active, prevStats.value.activeClients),
        isPositive: clientStats.active >= prevStats.value.activeClients,
        icon: Users,
        bgColor: 'bg-yellow-100',
        iconColor: 'text-yellow-600'
      }
    ];

    // Update previous stats
    prevStats.value = currentStats;
  } catch (error) {
    console.error('Erreur chargement stats:', error);
    // Fallback avec des données vides
    stats.value = [];
  } finally {
    loading.value = false;
  }
};

const calculateChange = (current, previous) => {
  if (previous === 0) return current > 0 ? '+100%' : '0%';
  const change = ((current - previous) / previous) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(0)}%`;
};

const formatAmount = (amount) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M FCFA`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K FCFA`;
  }
  return `${amount} FCFA`;
};

// Export report
const exportStatsReport = () => {
  if (stats.value.length === 0) {
    alert('Aucune statistique à exporter');
    return;
  }

  const reportData = stats.value.map(stat => ({
    'Indicateur': stat.title,
    'Valeur': stat.value,
    'Évolution': stat.change
  }));

  generateReportPDF('Rapport de Statistiques', reportData, `statistiques-${new Date().toISOString().split('T')[0]}`);
};

onMounted(() => {
  loadStats();
});
</script>

<template>
  <!-- Loading State -->
  <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div v-for="i in 4" :key="i" class="bg-white rounded-xl p-6 shadow-sm">
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
    <!-- Export Button -->
    <div class="flex justify-start sm:justify-end mb-4">
      <button
        @click="exportStatsReport"
        class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-medium rounded-lg transition-colors shadow-sm"
      >
        <FileText :size="16" />
        <span class="hidden sm:inline">Exporter le rapport</span>
        <span class="sm:hidden">Exporter rapport</span>
      </button>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
      <div
        v-for="(stat, index) in stats"
        :key="index"
        class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="flex items-start justify-between mb-4">
          <div :class="['w-14 h-14 rounded-xl flex items-center justify-center', stat.bgColor]">
            <component :is="stat.icon" :size="24" :class="stat.iconColor" />
          </div>
          <span
            :class="[
              'text-sm font-semibold',
              stat.isPositive ? 'text-green-600' : 'text-red-600'
            ]"
          >
            {{ stat.change }}
          </span>
        </div>
        <h3 class="text-2xl font-bold text-gray-900 mb-1">{{ stat.value }}</h3>
        <p class="text-sm text-gray-600">{{ stat.title }}</p>
      </div>
    </div>
  </div>
</template>