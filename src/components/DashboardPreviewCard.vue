<script setup>
import { ref, onMounted } from 'vue';
import { TrendingUp, AlertTriangle } from 'lucide-vue-next';
import { transactionService } from '../services/transaction.service';

const recentPayments = ref([]);
const totalToReceive = ref('0');
const overdueCount = ref(0);
const isLoading = ref(true);

const formatAmount = (amount) => {
  if (!amount) return '0';
  return amount >= 1000 ? `${(amount / 1000)}M` : amount;
};

const getStatusColor = (status) => {
  switch (status) {
    case 'payé':
      return 'text-emerald-600';
    case 'en cours':
      return 'text-orange-500';
    case 'retard':
      return 'text-red-500';
    default:
      return 'text-gray-600';
  }
};

const getAvatarColor = (avatar) => {
  return 'bg-teal-500';
};

const loadDashboardData = async () => {
  try {
    isLoading.value = true;
    const transactions = await transactionService.getTransactions({ _limit: 4, _sort: 'createdAt', _order: 'desc' });
    
    // Map transactions to payments format
    recentPayments.value = transactions.map((t, index) => ({
      id: t.id,
      avatar: String.fromCharCode(65 + index), // A, B, C, D...
      clientName: `Client ${t.clientId ? t.clientId.replace('client_', '') : (index + 1)}`,
      amount: formatAmount(t.amount),
      status: t.status === 'completed' ? 'payé' : t.status === 'pending' ? 'en cours' : 'retard'
    }));

    // Calculate stats
    const stats = await transactionService.getTransactionStats();
    totalToReceive.value = formatAmount(stats.pendingAmount || 0);
    overdueCount.value = stats.overdue || 0;
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error);
    // Fallback data
    recentPayments.value = [];
    totalToReceive.value = '0';
    overdueCount.value = 0;
  } finally {
    isLoading.value = false;
  }
};

onMounted(() => {
  loadDashboardData();
});
</script>

<template>
  <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-lg transform hover:scale-105 transition-transform duration-300">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-2xl font-bold text-gray-900">Tableau de bord</h3>
      <div class="flex gap-2">
        <div class="w-3.5 h-3.5 rounded-full bg-red-400"></div>
        <div class="w-3.5 h-3.5 rounded-full bg-yellow-400"></div>
        <div class="w-3.5 h-3.5 rounded-full bg-green-400"></div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 gap-5 mb-8">
      <!-- Total à recevoir -->
      <div class="bg-teal-500 rounded-2xl p-6 text-white shadow-lg">
        <p class="text-sm opacity-90 mb-2 font-medium">Total à recevoir</p>
        <p class="text-3xl font-bold mb-3">{{ totalToReceive }}M FCFA</p>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <TrendingUp :size="16" :stroke-width="2.5" />
          <span>En attente</span>
        </div>
      </div>

      <!-- En retard -->
      <div class="bg-red-400 rounded-2xl p-6 text-white shadow-lg">
        <p class="text-sm opacity-90 mb-2 font-medium">En retard</p>
        <p class="text-3xl font-bold mb-3">{{ overdueCount }}</p>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <AlertTriangle :size="16" :stroke-width="2.5" />
          <span>transactions</span>
        </div>
      </div>
    </div>

    <!-- Recent Payments -->
    <div>
      <h4 class="text-base font-semibold text-gray-600 mb-5">Paiements récents</h4>
      <div v-if="isLoading" class="space-y-4">
        <div class="flex items-center justify-between py-2">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-gray-200 animate-pulse"></div>
            <div class="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div class="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
        </div>
      </div>
      <div v-else-if="recentPayments.length === 0" class="text-center text-gray-500 py-4">
        Aucune transaction pour le moment
      </div>
      <div v-else class="space-y-4">
        <div 
          v-for="payment in recentPayments" 
          :key="payment.id"
          class="flex items-center justify-between py-2"
        >
          <div class="flex items-center gap-4">
            <div :class="[getAvatarColor(payment.avatar), 'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md']">
              {{ payment.avatar }}
            </div>
            <span class="text-gray-900 font-medium text-base">{{ payment.clientName }}</span>
          </div>
          <div class="text-right">
            <p class="text-gray-900 font-bold text-lg">{{ payment.amount }}K</p>
            <p :class="[getStatusColor(payment.status), 'text-sm font-semibold']">
              {{ payment.status }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

