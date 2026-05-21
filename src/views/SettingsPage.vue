<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ArrowLeft, Check, Crown, User, Wallet } from 'lucide-vue-next';
import DashboardHeader from '../components/dashboard/DashboardHeader.vue';
import { useUser } from '../composables/useUser.js';
import { subscriptionPlans } from '../data/subscriptionPlans.js';
import { subscriptionService } from '../services/subscription.service.js';
import { getUserFriendlyError } from '../utils/userFriendlyError.js';

const router = useRouter();
const route = useRoute();
const { user, loadUser, updateProfile } = useUser();

const activeTab = ref(route.query.tab === 'subscription' ? 'subscription' : 'profile');
const loading = ref(false);
const message = ref('');
const error = ref('');
const subscription = ref(null);
const billingHistory = ref([]);

const profileForm = ref({
  name: '',
  phone: ''
});

const currentPlanId = computed(() => subscription.value?.plan || user.value?.subscription?.plan || 'free');
const currentPlan = computed(() => subscriptionPlans[currentPlanId.value] || subscriptionPlans.free);
const clientsUsage = computed(() => subscription.value?.usage?.clients ?? user.value?.usage?.clients ?? 0);
const maxClients = computed(() => subscription.value?.limits?.maxClients ?? currentPlan.value?.limits?.maxClients);
const isPro = computed(() => currentPlanId.value === 'pro');
const displayUserEmail = computed(() => {
  const email = user.value?.email || '';
  return email.endsWith('@auth.paytranche.local') || email.endsWith('@paytranche.local')
    ? 'Compte social PayTranche'
    : email;
});

const formatAmount = (amount) =>
  new Intl.NumberFormat('fr-FR').format(Number(amount || 0)) + ' FCFA';

const formatDate = (value) => {
  if (!value) return 'Non défini';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Non défini';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const statusLabel = (status) => {
  const labels = {
    INITIATED: 'Créé',
    PENDING: 'En attente',
    COMPLETED: 'Payé',
    CANCELLED: 'Annulé',
    FAILED: 'Échoué'
  };
  return labels[status] || status;
};

const syncProfileForm = () => {
  profileForm.value = {
    name: user.value?.name || '',
    phone: user.value?.phone || ''
  };
};

const loadSubscription = async () => {
  loading.value = true;
  error.value = '';
  try {
    await loadUser();
    syncProfileForm();
    subscription.value = await subscriptionService.getCurrentSubscription();
    billingHistory.value = await subscriptionService.getBillingHistory();

    if (route.query.payment === 'success') {
      message.value = 'Paiement reçu. Le plan Pro s’active dès confirmation.';
    } else if (route.query.payment === 'cancel') {
      error.value = 'Paiement annulé. Votre plan n’a pas changé.';
    }
  } catch (loadError) {
    error.value = getUserFriendlyError(loadError, 'load');
  } finally {
    loading.value = false;
  }
};

const saveProfile = async () => {
  loading.value = true;
  error.value = '';
  message.value = '';
  try {
    const result = await updateProfile(profileForm.value);
    if (result.success) {
      message.value = 'Profil mis à jour';
    } else {
      error.value = result.error || 'Profil non mis à jour';
    }
  } finally {
    loading.value = false;
  }
};

onMounted(loadSubscription);
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <DashboardHeader />

    <main class="mx-auto max-w-5xl px-4 py-5 sm:px-6 lg:px-8">
      <button
        @click="router.push('/dashboard')"
        class="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
      >
        <ArrowLeft :size="18" />
        Retour
      </button>

      <div class="mb-5">
        <h1 class="text-2xl font-bold text-slate-950">Paramètres</h1>
        <p class="text-sm text-slate-500">Compte vendeur et abonnement PayTranche.</p>
      </div>

      <div v-if="message" class="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
        {{ message }}
      </div>
      <div v-if="error" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {{ error }}
      </div>

      <div class="mb-5 grid grid-cols-2 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        <button
          class="rounded-md px-3 py-2.5 text-sm font-bold"
          :class="activeTab === 'profile' ? 'bg-teal-600 text-white' : 'text-slate-600'"
          @click="activeTab = 'profile'"
        >
          Profil
        </button>
        <button
          class="rounded-md px-3 py-2.5 text-sm font-bold"
          :class="activeTab === 'subscription' ? 'bg-teal-600 text-white' : 'text-slate-600'"
          @click="activeTab = 'subscription'"
        >
          Abonnement
        </button>
      </div>

      <section v-if="activeTab === 'profile'" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div class="mb-5 flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
            <User :size="21" />
          </div>
          <div>
            <h2 class="font-bold text-slate-950">Profil vendeur</h2>
            <p class="text-sm text-slate-500">{{ displayUserEmail }}</p>
          </div>
        </div>

        <form class="grid gap-4 sm:grid-cols-2" @submit.prevent="saveProfile">
          <div>
            <label class="mb-1.5 block text-sm font-semibold text-slate-700">Nom complet</label>
            <input
              v-model="profileForm.name"
              type="text"
              class="w-full rounded-lg border border-slate-300 px-3 py-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <div>
            <label class="mb-1.5 block text-sm font-semibold text-slate-700">Téléphone</label>
            <input
              v-model="profileForm.phone"
              type="tel"
              class="w-full rounded-lg border border-slate-300 px-3 py-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>
          <div class="sm:col-span-2">
            <button
              type="submit"
              :disabled="loading"
              class="rounded-lg bg-teal-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              Enregistrer
            </button>
          </div>
        </form>
      </section>

      <section v-else class="space-y-5">
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p class="text-sm font-semibold text-slate-500">Plan actuel</p>
              <h2 class="text-2xl font-black text-slate-950">{{ currentPlan.name }}</h2>
              <p class="text-sm text-slate-500">
                {{ isPro ? `Valable jusqu’au ${formatDate(subscription?.currentPeriodEnd)}` : 'Gratuit, limité à 5 clients actifs' }}
              </p>
            </div>
            <div class="rounded-lg bg-slate-50 px-4 py-3 text-sm font-bold text-slate-700">
              Clients: {{ clientsUsage }} / {{ maxClients === null || maxClients === -1 ? 'illimité' : maxClients }}
            </div>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-3">
          <article class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-lg font-black text-slate-950">Gratuit</h3>
              <span v-if="currentPlanId === 'free'" class="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">Actuel</span>
            </div>
            <p class="mb-4 text-3xl font-black text-slate-950">0 FCFA</p>
            <ul class="space-y-2 text-sm text-slate-600">
              <li class="flex items-center gap-2"><Check :size="16" class="text-teal-600" />5 clients actifs</li>
              <li class="flex items-center gap-2"><Check :size="16" class="text-teal-600" />Dettes et paiements</li>
              <li class="flex items-center gap-2"><Check :size="16" class="text-teal-600" />Relances simples</li>
            </ul>
          </article>

          <article class="rounded-xl border-2 border-teal-500 bg-white p-4 shadow-sm lg:col-span-2">
            <div class="mb-4 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <Crown :size="22" class="text-teal-600" />
                <h3 class="text-lg font-black text-slate-950">Pro</h3>
              </div>
              <span v-if="isPro" class="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">Actuel</span>
            </div>

            <p class="mb-1 text-3xl font-black text-slate-950">{{ formatAmount(subscriptionPlans.pro.price) }}</p>
            <p class="mb-4 text-sm text-slate-500">Par mois, payé par le vendeur à PayTranche.</p>

            <div class="mb-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
              <div class="flex items-center gap-2"><Check :size="16" class="text-teal-600" />Clients illimités</div>
              <div class="flex items-center gap-2"><Check :size="16" class="text-teal-600" />Crédits illimités</div>
              <div class="flex items-center gap-2"><Check :size="16" class="text-teal-600" />Dashboard complet</div>
              <div class="flex items-center gap-2"><Check :size="16" class="text-teal-600" />Historique paiements</div>
            </div>

            <div v-if="!isPro" class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
              L’activation Pro se fera manuellement au lancement. Pour le moment, gardez le plan gratuit pour tester le suivi.
            </div>
          </article>
        </div>

        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <div class="mb-4 flex items-center gap-2">
            <Wallet :size="20" class="text-slate-600" />
            <h3 class="font-black text-slate-950">Historique abonnement</h3>
          </div>

          <div v-if="billingHistory.length === 0" class="rounded-lg bg-slate-50 px-4 py-4 text-sm font-medium text-slate-500">
            Aucun paiement d’abonnement pour le moment.
          </div>

          <div v-else class="divide-y divide-slate-100">
            <div
              v-for="payment in billingHistory"
              :key="payment.id"
              class="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p class="font-bold text-slate-900">Plan {{ payment.plan }}</p>
                <p class="text-xs text-slate-500">{{ payment.refCommand }} · {{ formatDate(payment.createdAt) }}</p>
              </div>
              <div class="text-left sm:text-right">
                <p class="font-black text-slate-950">{{ formatAmount(payment.amount) }}</p>
                <p class="text-xs font-bold text-slate-500">{{ statusLabel(payment.status) }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
