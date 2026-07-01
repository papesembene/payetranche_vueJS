<script setup>
import { ref, computed, onMounted } from 'vue';
import DashboardHeader from '../components/dashboard/DashboardHeader.vue';
import StatsCards from '../components/dashboard/StatsCards.vue';
import DebtsView from '../components/dashboard/DebtsView.vue';
import PaymentsView from '../components/dashboard/PaymentsView.vue';
import ClientsView from '../components/dashboard/ClientsView.vue';
import MoneyView from '../components/dashboard/MoneyView.vue';
import RemindersView from '../components/dashboard/RemindersView.vue';
import BusinessView from '../components/dashboard/BusinessView.vue';
import { useUserStore } from '../stores/user.js';
import { notificationService } from '../services/notification.service.js';
import { AlertTriangle, X, CreditCard, Banknote, Users, Wallet, ShoppingBag } from 'lucide-vue-next';

const userStore = useUserStore();

const user = computed(() => userStore.user);
const loading = computed(() => userStore.loading);

const activeTab = ref('debts');
const refreshStats = ref(0);
const reminders = ref([]);
const showNotifications = ref(true);
const contentSection = ref(null);

const navItems = [
  {
    id: 'debts',
    label: 'Clients qui doivent',
    mobileLabel: 'Dettes',
    helper: 'Voir les dettes, créer les tranches, enregistrer les paiements',
    icon: CreditCard
  },
  {
    id: 'payments',
    label: 'Paiements reçus',
    mobileLabel: 'Payés',
    helper: 'Voir seulement l’argent déjà payé',
    icon: Banknote
  },
  {
    id: 'clients',
    label: 'Clients',
    mobileLabel: 'Clients',
    helper: 'Ajouter ou retrouver une personne',
    icon: Users
  },
  {
    id: 'business',
    label: 'Ma boutique',
    mobileLabel: 'Boutique',
    helper: 'Suivre revenus, achats fournisseurs et dépenses',
    icon: ShoppingBag
  },
  {
    id: 'money',
    label: 'Mes numéros',
    mobileLabel: 'Numéros',
    helper: 'Numéros Wave/OM montrés au client',
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
  loadReminders();
};

const onPaymentSaved = () => {
  refreshStats.value++;
  loadReminders();
};

const onPaymentsUpdated = () => {
  refreshStats.value++;
  loadReminders();
};

const loadReminders = async () => {
  try {
    reminders.value = await notificationService.getTodayReminders();
  } catch (error) {
    reminders.value = [];
  }
};

const dismissNotification = () => {
  showNotifications.value = false;
};

const formatAmount = (amount) => `${new Intl.NumberFormat('fr-FR').format(Number(amount || 0))} FCFA`;

onMounted(() => {
  loadReminders();
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

      <div v-if="reminders.length > 0 && showNotifications" class="mb-6">
        <div class="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div class="flex items-start gap-3">
            <AlertTriangle :size="22" class="mt-0.5 shrink-0 text-amber-600" />
            <div class="min-w-0 flex-1">
              <h3 class="font-black text-amber-900">
                {{ reminders.length }} relance{{ reminders.length > 1 ? 's' : '' }} à faire
              </h3>
              <p class="mt-1 text-sm font-semibold text-amber-800">
                Total: {{ formatAmount(reminders.reduce((total, item) => total + item.amount, 0)) }}
              </p>
              <button
                type="button"
                @click="setActiveTab('reminders')"
                class="mt-3 inline-flex min-h-10 items-center justify-center rounded-lg bg-amber-600 px-4 text-sm font-black text-white"
              >
                Voir
              </button>
            </div>
            <button
              @click="dismissNotification"
              class="rounded-lg p-1 transition-colors hover:bg-amber-100"
              aria-label="Masquer"
            >
              <X :size="20" class="text-amber-700" />
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
          <BusinessView v-else-if="activeTab === 'business'" @updated="onPaymentsUpdated" />
          <RemindersView v-else-if="activeTab === 'reminders'" :refresh="refreshStats" @updated="onPaymentsUpdated" />
          <MoneyView v-else-if="activeTab === 'money'" />
        </section>
      </div>
    </main>

    <nav v-if="!loading && user" class="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white lg:hidden">
      <div class="grid grid-cols-5">
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
