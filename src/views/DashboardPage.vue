<script setup>
import { ref, computed, onMounted } from 'vue';
import DashboardHeader from '../components/dashboard/DashboardHeader.vue';
import StatsCards from '../components/dashboard/StatsCards.vue';
import PaymentsView from '../components/dashboard/PaymentsView.vue';
import ClientsView from '../components/dashboard/ClientsView.vue';
import SubscriptionStatus from '../components/SubscriptionStatus.vue';
import UpgradePrompt from '../components/UpgradePrompt.vue';
import { useUserStore } from '../stores/user.js';
import { transactionService } from '../services/transaction.service.js';
import { clientService } from '../services/client.service.js';
import { safeFormatDate } from '../utils/export.js';
import { AlertTriangle, X } from 'lucide-vue-next';

const userStore = useUserStore();

const user = computed(() => userStore.user);
const currentPlan = computed(() => userStore.currentPlan);
const loading = computed(() => userStore.loading);

const activeTab = ref('payments');
const refreshStats = ref(0);
const overduePayments = ref([]);
const showNotifications = ref(true);

const setActiveTab = (tab) => {
  activeTab.value = tab;
};

const handleUpgrade = () => {
  // TODO: Ouvrir modale de sélection de plan
  console.log('Ouvrir modale de mise à niveau');
};

const onClientSaved = () => {
  refreshStats.value++;
  loadOverduePayments();
};

const onPaymentSaved = () => {
  refreshStats.value++;
  loadOverduePayments();
};

const onPaymentsUpdated = () => {
  refreshStats.value++;
  loadOverduePayments();
};

const loadOverduePayments = async () => {
  try {
    const overdue = await transactionService.getOverdueTransactions();
    if (overdue.length > 0) {
      // Enrich with client names
      const clients = await clientService.getClients();
      const clientsMap = new Map(clients.map(c => [c.id, c.name]));

      overduePayments.value = overdue.map(payment => ({
        ...payment,
        clientName: clientsMap.get(payment.clientId) || 'Client inconnu'
      }));
    } else {
      overduePayments.value = [];
    }
  } catch (error) {
    console.error('Erreur chargement paiements en retard:', error);
    overduePayments.value = [];
  }
};

const dismissNotification = () => {
  showNotifications.value = false;
};

const formatAmount = (amount) => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

const formatDate = (dateString) => {
  return safeFormatDate(dateString);
};

onMounted(() => {
  loadOverduePayments();
});
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardHeader />

    <!-- Loading State -->
    <div v-if="loading || !user" class="flex items-center justify-center min-h-[60vh]">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
    </div>

    <!-- Main Content -->
    <main v-else class="max-w-7xl mx-auto px-6 lg:px-8 py-8">
      <!-- Page Title -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
        <p class="text-gray-600">Gérez vos paiements et suivez vos clients</p>
      </div>

      <!-- Overdue Payments Notification -->
      <div v-if="overduePayments.length > 0 && showNotifications" class="mb-6">
        <div class="bg-red-50 border border-red-200 rounded-xl p-4">
          <div class="flex items-start gap-3">
            <AlertTriangle :size="24" class="text-red-500 flex-shrink-0 mt-0.5" />
            <div class="flex-1">
              <h3 class="text-lg font-semibold text-red-800 mb-2">
                Paiements en retard ({{ overduePayments.length }})
              </h3>
              <div class="space-y-2">
                <div
                  v-for="payment in overduePayments.slice(0, 3)"
                  :key="payment.id"
                  class="flex justify-between items-center bg-white rounded-lg p-3 border border-red-200"
                >
                  <div>
                    <p class="font-medium text-gray-900">{{ payment.clientName }}</p>
                    <p class="text-sm text-gray-600">{{ formatAmount(payment.amount) }} - Échéance: {{ formatDate(payment.dueDate) }}</p>
                  </div>
                  <span class="text-red-600 font-semibold">En retard</span>
                </div>
                <p v-if="overduePayments.length > 3" class="text-sm text-red-700">
                  Et {{ overduePayments.length - 3 }} autres paiements en retard...
                </p>
              </div>
            </div>
            <button
              @click="dismissNotification"
              class="p-1 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X :size="20" class="text-red-500" />
            </button>
          </div>
        </div>
      </div>

      <!-- Upgrade Prompt -->
      <div class="mb-6">
        <UpgradePrompt @upgrade="handleUpgrade" />
      </div>

      <!-- Stats Cards -->
      <StatsCards :refresh="refreshStats" />

      <!-- Subscription Status -->
      <div class="mb-8">
        <SubscriptionStatus @upgrade="handleUpgrade" />
      </div>

      <!-- Tabs -->
      <div class="flex gap-4 mb-6">
        <button
          @click="setActiveTab('payments')"
          :class="[
            'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all',
            activeTab === 'payments'
              ? 'bg-teal-500 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          ]"
        >
          <DollarSign :size="20" />
          Paiements
        </button>
        <button
          @click="setActiveTab('clients')"
          :class="[
            'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all',
            activeTab === 'clients'
              ? 'bg-teal-500 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          ]"
        >
          <Users :size="20" />
          Clients
        </button>
      </div>

      <!-- Content -->
      <PaymentsView v-if="activeTab === 'payments'" :refresh="refreshStats" @saved="onPaymentSaved" @updated="onPaymentsUpdated" />
      <ClientsView v-else :refresh="refreshStats" @saved="onClientSaved" />
    </main>
  </div>
</template>

<script>
import { DollarSign, Users } from 'lucide-vue-next';
export default {
  components: {
    DollarSign,
    Users
  }
};
</script>