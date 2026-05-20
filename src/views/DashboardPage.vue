<script setup>
import { ref, computed, onMounted } from 'vue';
import DashboardHeader from '../components/dashboard/DashboardHeader.vue';
import StatsCards from '../components/dashboard/StatsCards.vue';
import DebtsView from '../components/dashboard/DebtsView.vue';
import PaymentsView from '../components/dashboard/PaymentsView.vue';
import ClientsView from '../components/dashboard/ClientsView.vue';
import MoneyView from '../components/dashboard/MoneyView.vue';
import { useUserStore } from '../stores/user.js';
import { transactionService } from '../services/transaction.service.js';
import { clientService } from '../services/client.service.js';
import { safeFormatDate } from '../utils/export.js';
import { AlertTriangle, X, CreditCard, DollarSign, Users, Wallet } from 'lucide-vue-next';

const userStore = useUserStore();

const user = computed(() => userStore.user);
const loading = computed(() => userStore.loading);

const activeTab = ref('debts');
const refreshStats = ref(0);
const overduePayments = ref([]);
const showNotifications = ref(true);
const contentSection = ref(null);

const navItems = [
  {
    id: 'debts',
    label: 'Clients qui doivent',
    mobileLabel: 'Dettes',
    helper: 'Voir les dettes, créer les tranches, envoyer un lien',
    icon: CreditCard
  },
  {
    id: 'payments',
    label: 'Paiements reçus',
    mobileLabel: 'Payés',
    helper: 'Voir seulement l’argent déjà payé',
    icon: DollarSign
  },
  {
    id: 'clients',
    label: 'Clients',
    mobileLabel: 'Clients',
    helper: 'Ajouter ou retrouver une personne',
    icon: Users
  },
  {
    id: 'money',
    label: 'Mon argent',
    mobileLabel: 'Argent',
    helper: 'Compte Wave/OM et reversements vendeur',
    icon: Wallet
  }
];

const setActiveTab = (tab) => {
  activeTab.value = tab;
  requestAnimationFrame(() => {
    contentSection.value?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  });
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
  <div class="min-h-screen bg-gray-50 pb-24 lg:pb-0">
    <DashboardHeader />

    <!-- Loading State -->
    <div v-if="loading || !user" class="flex items-center justify-center min-h-[60vh]">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
    </div>

    <!-- Main Content -->
    <main v-else class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 lg:py-8">
      <div class="mb-4 lg:mb-6">
        <h1 class="text-xl sm:text-3xl font-bold text-gray-950 leading-tight">PayTranche</h1>
      </div>

      <div v-if="overduePayments.length > 0 && showNotifications" class="mb-6">
        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
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

      <StatsCards :refresh="refreshStats" />

      <div class="grid lg:grid-cols-[300px_1fr] gap-6 items-start">
        <aside class="hidden lg:block bg-white border border-gray-200 rounded-lg p-4 lg:sticky lg:top-6">
          <div class="space-y-2">
            <button
              v-for="item in navItems"
              :key="item.id"
              @click="setActiveTab(item.id)"
              :class="[
                'w-full flex items-start gap-3 rounded-lg border px-3 py-3 text-left transition-colors',
                activeTab === item.id
                  ? 'border-teal-300 bg-teal-50 text-teal-900'
                  : 'border-transparent hover:border-gray-200 hover:bg-gray-50 text-gray-700'
              ]"
            >
              <span
                :class="[
                  'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                  activeTab === item.id ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-600'
                ]"
              >
                <component :is="item.icon" :size="19" />
              </span>
              <span class="min-w-0 flex-1">
                <span class="block font-semibold">{{ item.label }}</span>
              </span>
            </button>
          </div>
        </aside>

        <section ref="contentSection" class="min-w-0 scroll-mt-4 lg:scroll-mt-6">
          <DebtsView v-if="activeTab === 'debts'" :refresh="refreshStats" @updated="onPaymentsUpdated" />
          <PaymentsView v-else-if="activeTab === 'payments'" :refresh="refreshStats" @saved="onPaymentSaved" @updated="onPaymentsUpdated" />
          <ClientsView v-else-if="activeTab === 'clients'" :refresh="refreshStats" @saved="onClientSaved" />
          <MoneyView v-else />
        </section>
      </div>
    </main>

    <nav v-if="!loading && user" class="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white lg:hidden">
      <div class="grid grid-cols-4">
        <button
          v-for="item in navItems"
          :key="item.id"
          @click="setActiveTab(item.id)"
          :class="[
            'flex min-h-[68px] flex-col items-center justify-center gap-1 px-1 text-xs font-semibold',
            activeTab === item.id ? 'text-teal-600' : 'text-gray-500'
          ]"
        >
          <span
            :class="[
              'flex h-8 w-8 items-center justify-center rounded-lg',
              activeTab === item.id ? 'bg-teal-50' : 'bg-transparent'
            ]"
          >
            <component :is="item.icon" :size="20" />
          </span>
          <span class="leading-none">{{ item.mobileLabel }}</span>
        </button>
      </div>
    </nav>
  </div>
</template>
