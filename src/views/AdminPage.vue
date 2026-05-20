<script setup>
import { computed, onMounted, ref } from 'vue';
import {
  ArrowLeft,
  Ban,
  Building2,
  CheckCircle,
  Copy,
  CreditCard,
  Crown,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
  Send,
  Shield,
  Users,
  Wallet
} from 'lucide-vue-next';
import { useRouter } from 'vue-router';
import DashboardHeader from '../components/dashboard/DashboardHeader.vue';
import MobileMoneyIcon from '../components/dashboard/MobileMoneyIcon.vue';
import { adminService } from '../services/admin.service.js';

const router = useRouter();
const loading = ref(false);
const actionLoadingId = ref(null);
const error = ref('');
const search = ref('');
const overview = ref(null);
const tenants = ref([]);
const payments = ref([]);
const payouts = ref([]);
const paymentConfig = ref(null);
const activeTab = ref('tenants');
const payoutSearch = ref('');
const payoutStatus = ref('ALL');
const copiedKey = ref('');

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

const planLabel = (plan) => {
  const labels = {
    GRATUIT: 'Gratuit',
    PRO: 'Pro',
    ENTREPRISE: 'Entreprise'
  };
  return labels[plan] || plan;
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

const payoutStatusLabel = (status) => {
  const labels = {
    PENDING: 'À recevoir',
    PROCESSING: 'En cours',
    SENT: 'Versé',
    FAILED: 'Échoué'
  };
  return labels[status] || status;
};

const payoutStatusClass = (status) => {
  if (status === 'SENT') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'FAILED') return 'bg-red-50 text-red-700 border-red-100';
  if (status === 'PROCESSING') return 'bg-blue-50 text-blue-700 border-blue-100';
  return 'bg-amber-50 text-amber-700 border-amber-100';
};

const operatorLabel = (operator) => {
  const labels = {
    WAVE: 'Wave',
    ORANGE_MONEY: 'Orange Money'
  };
  return labels[operator] || operator;
};

const configItems = computed(() => {
  const config = paymentConfig.value;
  if (!config?.urls) return [];

  return [
    { key: 'clientPaymentIpn', label: 'Paiement client', value: config.urls.clientPaymentIpn },
    { key: 'subscriptionIpn', label: 'Abonnement SaaS', value: config.urls.subscriptionIpn },
    { key: 'payoutCallback', label: 'Reversement vendeur', value: config.urls.payoutCallback },
    { key: 'clientPaymentSuccess', label: 'Retour paiement réussi', value: config.urls.clientPaymentSuccess },
    { key: 'clientPaymentCancel', label: 'Retour paiement annulé', value: config.urls.clientPaymentCancel },
    { key: 'health', label: 'Santé API', value: config.urls.health }
  ];
});

const yesNo = (value) => (value ? 'Oui' : 'Non');

const stats = computed(() => [
  { label: 'Entreprises', value: overview.value?.tenants || 0, icon: Building2 },
  { label: 'Actives', value: overview.value?.activeTenants || 0, icon: CheckCircle },
  { label: 'À verser', value: formatAmount(overview.value?.pendingPayoutAmount || 0), icon: Wallet },
  { label: 'Revenu SaaS', value: formatAmount(overview.value?.subscriptionRevenue || 0), icon: CreditCard }
]);

const loadAdmin = async () => {
  loading.value = true;
  error.value = '';
  try {
    const [overviewData, tenantsData, paymentsData, payoutsData, paymentConfigData] = await Promise.all([
      adminService.getOverview(),
      adminService.getTenants(search.value),
      adminService.getSubscriptionPayments(),
      adminService.getPayouts({ search: payoutSearch.value, status: payoutStatus.value }),
      adminService.getPaymentConfig()
    ]);
    overview.value = overviewData;
    tenants.value = tenantsData;
    payments.value = paymentsData;
    payouts.value = payoutsData;
    paymentConfig.value = paymentConfigData;
  } catch (loadError) {
    error.value = loadError.response?.data?.message || loadError.message || 'Accès admin impossible';
  } finally {
    loading.value = false;
  }
};

const loadPayouts = async () => {
  loading.value = true;
  error.value = '';
  try {
    payouts.value = await adminService.getPayouts({
      search: payoutSearch.value,
      status: payoutStatus.value
    });
  } catch (loadError) {
    error.value = loadError.response?.data?.message || loadError.message || 'Reversements impossibles à charger';
  } finally {
    loading.value = false;
  }
};

const toggleTenant = async (tenant) => {
  actionLoadingId.value = tenant.id;
  error.value = '';
  try {
    await adminService.updateTenantStatus(tenant.id, !tenant.isActive);
    await loadAdmin();
  } catch (toggleError) {
    error.value = toggleError.response?.data?.message || toggleError.message || 'Action impossible';
  } finally {
    actionLoadingId.value = null;
  }
};

const setPlan = async (user, plan) => {
  actionLoadingId.value = user.id;
  error.value = '';
  try {
    const expiry = plan === 'GRATUIT'
      ? null
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await adminService.updateUserPlan(user.id, plan, expiry);
    await loadAdmin();
  } catch (planError) {
    error.value = planError.response?.data?.message || planError.message || 'Plan non modifié';
  } finally {
    actionLoadingId.value = null;
  }
};

const syncPayout = async (payout) => {
  actionLoadingId.value = `sync-${payout.id}`;
  error.value = '';
  try {
    await adminService.syncPayout(payout.id);
    await loadAdmin();
  } catch (syncError) {
    error.value = syncError.response?.data?.message || syncError.message || 'Synchronisation impossible';
  } finally {
    actionLoadingId.value = null;
  }
};

const sendPayout = async (payout) => {
  actionLoadingId.value = `send-${payout.id}`;
  error.value = '';
  try {
    await adminService.sendPayout(payout.id);
    await loadAdmin();
  } catch (sendError) {
    error.value = sendError.response?.data?.message || sendError.message || 'Reversement impossible';
  } finally {
    actionLoadingId.value = null;
  }
};

const copyValue = async (value, key) => {
  if (!value) return;

  try {
    await navigator.clipboard.writeText(value);
    copiedKey.value = key;
    window.setTimeout(() => {
      if (copiedKey.value === key) copiedKey.value = '';
    }, 1500);
  } catch {
    error.value = 'Copie impossible depuis ce navigateur.';
  }
};

onMounted(loadAdmin);
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <DashboardHeader />

    <main class="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <button
        class="mb-5 flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"
        @click="router.push('/dashboard')"
      >
        <ArrowLeft :size="18" />
        Retour
      </button>

      <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div class="mb-1 flex items-center gap-2 text-teal-700">
            <Shield :size="20" />
            <span class="text-sm font-black uppercase tracking-wide">Admin PayTranche</span>
          </div>
          <h1 class="text-2xl font-black text-slate-950">Back-office SaaS</h1>
          <p class="text-sm text-slate-500">Vendeurs, plans, abonnements et reversements.</p>
        </div>
      </div>

      <div v-if="error" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
        {{ error }}
      </div>

      <div class="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="item in stats"
          :key="item.label"
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div class="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <component :is="item.icon" :size="21" />
          </div>
          <p class="text-sm font-semibold text-slate-500">{{ item.label }}</p>
          <p class="text-2xl font-black text-slate-950">{{ item.value }}</p>
        </div>
      </div>

      <div class="mb-5 grid grid-cols-2 rounded-lg border border-slate-200 bg-white p-1 shadow-sm sm:max-w-2xl sm:grid-cols-4">
        <button
          class="rounded-md px-3 py-2.5 text-sm font-bold"
          :class="activeTab === 'tenants' ? 'bg-teal-600 text-white' : 'text-slate-600'"
          @click="activeTab = 'tenants'"
        >
          Vendeurs
        </button>
        <button
          class="rounded-md px-3 py-2.5 text-sm font-bold"
          :class="activeTab === 'payments' ? 'bg-teal-600 text-white' : 'text-slate-600'"
          @click="activeTab = 'payments'"
        >
          Paiements
        </button>
        <button
          class="rounded-md px-3 py-2.5 text-sm font-bold"
          :class="activeTab === 'payouts' ? 'bg-teal-600 text-white' : 'text-slate-600'"
          @click="activeTab = 'payouts'"
        >
          Reversements
        </button>
        <button
          class="rounded-md px-3 py-2.5 text-sm font-bold"
          :class="activeTab === 'config' ? 'bg-teal-600 text-white' : 'text-slate-600'"
          @click="activeTab = 'config'"
        >
          Configuration
        </button>
      </div>

      <section v-if="activeTab === 'tenants'" class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="relative">
            <Search :size="18" class="absolute left-3 top-3.5 text-slate-400" />
            <input
              v-model="search"
              type="search"
              class="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              placeholder="Chercher boutique, vendeur, email"
              @keyup.enter="loadAdmin"
            />
          </div>
        </div>

        <div v-if="loading" class="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">
          Chargement...
        </div>

        <article
          v-for="tenant in tenants"
          :key="tenant.id"
          class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div class="mb-2 flex flex-wrap items-center gap-2">
                <h2 class="text-lg font-black text-slate-950">{{ tenant.name }}</h2>
                <span
                  class="rounded-full px-2.5 py-1 text-xs font-bold"
                  :class="tenant.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'"
                >
                  {{ tenant.isActive ? 'Actif' : 'Bloqué' }}
                </span>
              </div>
              <p class="text-sm font-medium text-slate-600">{{ tenant.owner?.name }} · {{ tenant.owner?.email }}</p>
              <p class="text-xs text-slate-400">Créé le {{ formatDate(tenant.createdAt) }}</p>
            </div>

            <div class="grid grid-cols-3 gap-2 text-center sm:min-w-72">
              <div class="rounded-lg bg-slate-50 p-2">
                <p class="text-xs text-slate-500">Clients</p>
                <p class="font-black text-slate-950">{{ tenant._count.clients }}</p>
              </div>
              <div class="rounded-lg bg-slate-50 p-2">
                <p class="text-xs text-slate-500">Crédits</p>
                <p class="font-black text-slate-950">{{ tenant._count.credits }}</p>
              </div>
              <div class="rounded-lg bg-slate-50 p-2">
                <p class="text-xs text-slate-500">Paiements</p>
                <p class="font-black text-slate-950">{{ tenant._count.payments }}</p>
              </div>
            </div>
          </div>

          <div class="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex flex-wrap items-center gap-2">
              <span class="flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-black text-teal-700">
                <Crown :size="14" />
                {{ planLabel(tenant.owner?.plan) }}
              </span>
              <span class="text-xs font-medium text-slate-500">
                Expire: {{ formatDate(tenant.owner?.planExpiresAt) }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2 sm:flex">
              <button
                class="rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
                :disabled="actionLoadingId === tenant.owner?.id"
                @click="setPlan(tenant.owner, 'GRATUIT')"
              >
                Gratuit
              </button>
              <button
                class="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-bold text-teal-700"
                :disabled="actionLoadingId === tenant.owner?.id"
                @click="setPlan(tenant.owner, 'PRO')"
              >
                Pro 30j
              </button>
              <button
                class="rounded-lg border px-3 py-2 text-sm font-bold"
                :class="tenant.isActive ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'"
                :disabled="actionLoadingId === tenant.id"
                @click="toggleTenant(tenant)"
              >
                <span v-if="actionLoadingId === tenant.id" class="inline-flex items-center gap-1">
                  <Loader2 :size="14" class="animate-spin" />
                  ...
                </span>
                <span v-else class="inline-flex items-center gap-1">
                  <Ban v-if="tenant.isActive" :size="14" />
                  <CheckCircle v-else :size="14" />
                  {{ tenant.isActive ? 'Bloquer' : 'Activer' }}
                </span>
              </button>
            </div>
          </div>
        </article>
      </section>

      <section v-else-if="activeTab === 'payments'" class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div v-if="payments.length === 0" class="py-8 text-center text-sm font-medium text-slate-500">
          Aucun paiement d’abonnement.
        </div>

        <div v-else class="divide-y divide-slate-100">
          <div
            v-for="payment in payments"
            :key="payment.id"
            class="grid gap-2 py-4 lg:grid-cols-[1.5fr_1fr_1fr_1fr]"
          >
            <div>
              <p class="font-black text-slate-950">{{ payment.tenant?.name }}</p>
              <p class="text-xs text-slate-500">{{ payment.user?.email }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-500">Plan</p>
              <p class="font-bold text-slate-900">{{ planLabel(payment.plan) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-500">Montant</p>
              <p class="font-bold text-slate-900">{{ formatAmount(payment.amount) }}</p>
            </div>
            <div>
              <p class="text-xs font-semibold text-slate-500">Statut</p>
              <p class="font-bold text-slate-900">{{ statusLabel(payment.status) }}</p>
              <p class="text-xs text-slate-400">{{ formatDate(payment.createdAt) }}</p>
            </div>
          </div>
        </div>
      </section>

      <section v-else-if="activeTab === 'payouts'" class="space-y-4">
        <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
            <div class="relative">
              <Search :size="18" class="absolute left-3 top-3.5 text-slate-400" />
              <input
                v-model="payoutSearch"
                type="search"
                class="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="Chercher vendeur, client, numéro"
                @keyup.enter="loadPayouts"
              />
            </div>
            <select
              v-model="payoutStatus"
              class="rounded-lg border border-slate-300 px-3 py-3 text-base font-semibold text-slate-700 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              @change="loadPayouts"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="PENDING">À recevoir</option>
              <option value="PROCESSING">En cours</option>
              <option value="SENT">Versé</option>
              <option value="FAILED">Échoué</option>
            </select>
            <button
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white"
              @click="loadPayouts"
            >
              <RefreshCw :size="17" />
              Actualiser
            </button>
          </div>
        </div>

        <div v-if="loading" class="rounded-xl border border-slate-200 bg-white p-6 text-center text-slate-500">
          Chargement...
        </div>

        <div v-else-if="payouts.length === 0" class="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm font-medium text-slate-500 shadow-sm">
          Aucun reversement.
        </div>

        <template v-else>
          <article
            v-for="payout in payouts"
            :key="payout.id"
            class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <div class="grid gap-4 lg:grid-cols-[1.2fr_1fr_1fr_auto] lg:items-center">
              <div>
                <div class="mb-2 flex flex-wrap items-center gap-2">
                  <p class="text-lg font-black text-slate-950">{{ formatAmount(payout.netAmount) }}</p>
                  <span :class="['rounded-full border px-2.5 py-1 text-xs font-black', payoutStatusClass(payout.status)]">
                    {{ payoutStatusLabel(payout.status) }}
                  </span>
                </div>
                <p class="font-bold text-slate-800">{{ payout.tenant?.name || 'Vendeur' }}</p>
                <p class="text-xs text-slate-500">
                  {{ payout.tenant?.users?.[0]?.email || 'Email non renseigné' }}
                </p>
              </div>

              <div>
                <p class="text-xs font-semibold text-slate-500">Compte vendeur</p>
                <div class="mt-1 flex items-center gap-2">
                  <MobileMoneyIcon :operator="payout.operator" size="sm" />
                  <div class="min-w-0">
                    <p class="font-bold text-slate-900">{{ operatorLabel(payout.operator) }}</p>
                    <p class="truncate text-sm text-slate-500">{{ payout.phone }}</p>
                  </div>
                </div>
              </div>

              <div>
                <p class="text-xs font-semibold text-slate-500">Paiement client</p>
                <p class="font-bold text-slate-900">{{ payout.client?.name || 'Client' }}</p>
                <p class="text-sm text-slate-500">{{ payout.client?.phone || 'Téléphone non renseigné' }}</p>
                <p class="text-xs text-slate-400">{{ formatDate(payout.payment?.paidAt || payout.createdAt) }}</p>
              </div>

              <div class="grid grid-cols-2 gap-2 lg:min-w-56">
                <button
                  class="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-slate-700"
                  :disabled="actionLoadingId === `sync-${payout.id}`"
                  @click="syncPayout(payout)"
                >
                  <Loader2 v-if="actionLoadingId === `sync-${payout.id}`" :size="15" class="animate-spin" />
                  <RefreshCw v-else :size="15" />
                  Sync
                </button>
                <button
                  class="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
                  :disabled="payout.status === 'SENT' || actionLoadingId === `send-${payout.id}`"
                  @click="sendPayout(payout)"
                >
                  <Loader2 v-if="actionLoadingId === `send-${payout.id}`" :size="15" class="animate-spin" />
                  <Send v-else :size="15" />
                  Relancer
                </button>
              </div>
            </div>

            <div v-if="payout.failureReason" class="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">
              {{ payout.failureReason }}
            </div>
          </article>
        </template>
      </section>

      <section v-else class="space-y-4">
        <div
          class="rounded-xl border p-5 shadow-sm"
          :class="paymentConfig?.readiness?.productionReady ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'"
        >
          <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p class="text-sm font-black uppercase tracking-wide text-slate-600">État production</p>
              <h2 class="mt-1 text-2xl font-black text-slate-950">
                {{ paymentConfig?.readiness?.productionReady ? 'Prêt pour la production' : 'Configuration à finaliser' }}
              </h2>
            </div>
            <button
              class="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white"
              @click="loadAdmin"
            >
              <RefreshCw :size="17" />
              Vérifier
            </button>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-sm font-semibold text-slate-500">Mode PayTech</p>
            <p class="mt-2 text-2xl font-black text-slate-950">
              {{ paymentConfig?.paytech?.environment === 'prod' ? 'Production' : 'Test' }}
            </p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-sm font-semibold text-slate-500">Clés PayTech</p>
            <p class="mt-2 text-2xl font-black" :class="paymentConfig?.paytech?.configured ? 'text-emerald-700' : 'text-red-700'">
              {{ paymentConfig?.paytech?.configured ? 'OK' : 'Manquantes' }}
            </p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-sm font-semibold text-slate-500">Paiements clients</p>
            <p class="mt-2 text-2xl font-black" :class="paymentConfig?.readiness?.canReceivePayments ? 'text-emerald-700' : 'text-red-700'">
              {{ yesNo(paymentConfig?.readiness?.canReceivePayments) }}
            </p>
          </div>
          <div class="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p class="text-sm font-semibold text-slate-500">Reversement auto</p>
            <p class="mt-2 text-2xl font-black" :class="paymentConfig?.readiness?.canAutoPayout ? 'text-emerald-700' : 'text-amber-700'">
              {{ yesNo(paymentConfig?.readiness?.canAutoPayout) }}
            </p>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
          <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 class="text-lg font-black text-slate-950">Application</h3>
            <div class="mt-4 space-y-3">
              <div>
                <p class="text-xs font-bold uppercase text-slate-500">API publique</p>
                <p class="break-all text-sm font-semibold text-slate-900">{{ paymentConfig?.publicApiUrl || 'Non configurée' }}</p>
              </div>
              <div>
                <p class="text-xs font-bold uppercase text-slate-500">Frontend</p>
                <p class="break-all text-sm font-semibold text-slate-900">{{ paymentConfig?.frontendUrl || 'Non configuré' }}</p>
              </div>
            </div>

            <div v-if="paymentConfig?.readiness?.warnings?.length" class="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3">
              <p class="mb-2 text-sm font-black text-amber-800">À corriger</p>
              <ul class="space-y-1 text-sm font-semibold text-amber-800">
                <li v-for="warning in paymentConfig.readiness.warnings" :key="warning">
                  {{ warning }}
                </li>
              </ul>
            </div>
          </section>

          <section class="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 class="text-lg font-black text-slate-950">URLs PayTech</h3>
            <div v-if="configItems.length === 0" class="mt-4 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm font-semibold text-slate-500">
              Ajoutez PUBLIC_API_URL pour générer les callbacks.
            </div>
            <div v-else class="mt-4 space-y-3">
              <div
                v-for="item in configItems"
                :key="item.key"
                class="rounded-lg border border-slate-200 p-3"
              >
                <div class="mb-2 flex items-center justify-between gap-3">
                  <p class="text-sm font-black text-slate-900">{{ item.label }}</p>
                  <div class="flex items-center gap-2">
                    <button
                      class="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-700"
                      @click="copyValue(item.value, item.key)"
                    >
                      <Copy :size="13" />
                      {{ copiedKey === item.key ? 'Copié' : 'Copier' }}
                    </button>
                    <a
                      :href="item.value"
                      target="_blank"
                      rel="noreferrer"
                      class="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-2 py-1.5 text-xs font-bold text-white"
                    >
                      <ExternalLink :size="13" />
                      Ouvrir
                    </a>
                  </div>
                </div>
                <p class="break-all text-sm font-semibold text-slate-600">{{ item.value }}</p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </main>
  </div>
</template>
