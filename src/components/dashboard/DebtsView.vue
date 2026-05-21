<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { AlertTriangle, Banknote, CalendarDays, Check, ChevronDown, CreditCard, ListChecks, Plus, Search, X } from 'lucide-vue-next';
import { clientService } from '../../services/client.service.js';
import { installmentService } from '../../services/installment.service.js';
import { transactionService } from '../../services/transaction.service.js';
import MobileMoneyIcon from './MobileMoneyIcon.vue';
import { getUserFriendlyError } from '../../utils/userFriendlyError.js';

const props = defineProps({
  refresh: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['updated']);

const loading = ref(false);
const actionLoadingId = ref(null);
const clients = ref([]);
const transactions = ref([]);
const installments = ref([]);
const debtTimelines = ref({});
const timelineLoadingIds = ref(new Set());
const searchQuery = ref('');
const selectedStatus = ref('À récupérer');
const expandedDebtIds = ref(new Set());
const showDebtModal = ref(false);
const showPaymentModal = ref(false);
const showPlanModal = ref(false);
const selectedDebt = ref(null);
const selectedInstallment = ref(null);
const errors = ref({});

const debtForm = ref({
  clientMode: 'new',
  clientId: '',
  clientName: '',
  clientPhone: '',
  amount: '',
  paidAmount: '',
  dueDate: '',
  description: '',
  paymentMode: 'later',
  installmentCount: 3,
  firstInstallmentDate: '',
  installmentFrequency: 'MONTHLY'
});

const paymentForm = ref({
  amount: '',
  method: 'WAVE',
  reference: '',
  description: ''
});

const planForm = ref({
  count: 3,
  firstDueDate: '',
  frequency: 'MONTHLY'
});

const statusFilters = ['À récupérer', 'En retard', 'Payées', 'Toutes'];
const paymentMethods = [
  { value: 'WAVE', label: 'Wave', iconOperator: 'WAVE' },
  { value: 'ORANGE_MONEY', label: 'Orange Money', iconOperator: 'ORANGE_MONEY' },
  { value: 'CASH', label: 'Espèces' }
];

watch(() => props.refresh, () => {
  loadData();
});

const today = new Date().toISOString().split('T')[0];

const formatAmount = (amount) => {
  return new Intl.NumberFormat('fr-FR').format(Number(amount || 0)) + ' FCFA';
};

const formatDate = (dateString) => {
  if (!dateString) return 'Sans échéance';
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return 'Sans échéance';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const isDebtOverdue = (debt) => {
  if (!debt.dueDate || debt.status === 'completed') return false;
  const dueDate = new Date(debt.dueDate);
  if (Number.isNaN(dueDate.getTime())) return false;
  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < todayDate;
};

const loadData = async () => {
  if (loading.value) return;

  try {
    loading.value = true;
    const [clientsData, transactionsData, installmentsData] = await Promise.all([
      clientService.getClients(),
      transactionService.getTransactions(),
      installmentService.getInstallments()
    ]);
    clients.value = clientsData;
    transactions.value = transactionsData;
    installments.value = installmentsData;
  } catch (error) {
    console.error('Erreur chargement dettes:', error);
    clients.value = [];
    transactions.value = [];
  } finally {
    loading.value = false;
  }
};

const clientMap = computed(() => new Map(clients.value.map(client => [client.id, client])));
const installmentsByCredit = computed(() => {
  const map = new Map();
  installments.value.forEach((installment) => {
    const current = map.get(installment.creditId) || [];
    current.push(installment);
    map.set(
      installment.creditId,
      current.sort((a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0))
    );
  });
  return map;
});

const debts = computed(() => {
  return transactions.value
    .filter(transaction => transaction.backendType === 'credit')
    .map(debt => {
      const client = clientMap.value.get(debt.clientId);
      const overdue = isDebtOverdue(debt);
      const paid = debt.remainingAmount <= 0 || debt.status === 'completed';

      return {
        ...debt,
        clientName: client?.name || 'Client inconnu',
        clientPhone: client?.phone,
        installments: installmentsByCredit.value.get(debt.id) || [],
        displayStatus: paid ? 'Payée' : overdue ? 'En retard' : 'En cours',
        statusColor: paid
          ? 'bg-green-100 text-green-700'
          : overdue
            ? 'bg-red-100 text-red-700'
            : 'bg-blue-100 text-blue-700'
      };
    });
});

const filteredDebts = computed(() => {
  let filtered = debts.value;

  if (searchQuery.value) {
    filtered = filtered.filter(debt =>
      debt.clientName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      debt.description?.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  if (selectedStatus.value === 'À récupérer') {
    filtered = filtered.filter(debt => debt.remainingAmount > 0);
  } else if (selectedStatus.value === 'En retard') {
    filtered = filtered.filter(debt => debt.displayStatus === 'En retard');
  } else if (selectedStatus.value === 'Payées') {
    filtered = filtered.filter(debt => debt.displayStatus === 'Payée');
  }

  return filtered.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
});

const getProgressPercent = (debt) => {
  const originalAmount = Number(debt.originalAmount || debt.amount || 0);
  if (!originalAmount) return 0;
  return Math.min(Math.round((Number(debt.paidAmount || 0) / originalAmount) * 100), 100);
};

const getNextInstallment = (debt) => {
  return debt.installments.find(installment => installment.remainingAmount > 0) || null;
};

const getInstallmentSummary = (debt) => {
  const total = debt.installments.length;
  const paid = debt.installments.filter(installment => installment.remainingAmount <= 0 || installment.status === 'PAYEE').length;
  return { total, paid };
};

const loadDebtTimeline = async (debtId, force = false) => {
  if (!force && debtTimelines.value[debtId]) return;

  const nextLoading = new Set(timelineLoadingIds.value);
  nextLoading.add(debtId);
  timelineLoadingIds.value = nextLoading;

  try {
    const timeline = await transactionService.getCreditTimeline(debtId);
    debtTimelines.value = {
      ...debtTimelines.value,
      [debtId]: timeline
    };
  } catch (error) {
    debtTimelines.value = {
      ...debtTimelines.value,
      [debtId]: []
    };
  } finally {
    const doneLoading = new Set(timelineLoadingIds.value);
    doneLoading.delete(debtId);
    timelineLoadingIds.value = doneLoading;
  }
};

const toggleDetails = (debtId) => {
  const next = new Set(expandedDebtIds.value);
  if (next.has(debtId)) {
    next.delete(debtId);
  } else {
    next.add(debtId);
    loadDebtTimeline(debtId);
  }
  expandedDebtIds.value = next;
};

const isExpanded = (debtId) => expandedDebtIds.value.has(debtId);

const isTimelineLoading = (debtId) => timelineLoadingIds.value.has(debtId);

const getDebtTimeline = (debtId) => debtTimelines.value[debtId] || [];

const formatTimelineDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const timelineStatusLabel = (status) => {
  const labels = {
    ACTIF: 'En cours',
    PAYE: 'Payée',
    EN_RETARD: 'En retard',
    PENDING: 'En attente',
    INITIATED: 'Créé',
    COMPLETED: 'Reçu',
    CANCELLED: 'Annulé',
    FAILED: 'Échoué'
  };
  return labels[status] || status;
};

const timelineTypeClass = (type) => {
  const classes = {
    CREDIT_CREATED: 'bg-slate-900',
    PAYTECH_LINK_CREATED: 'bg-teal-500',
    PAYMENT_RECEIVED: 'bg-green-600',
    INSTALLMENT_PAID: 'bg-indigo-600'
  };
  return classes[type] || 'bg-slate-400';
};

const openDebtModal = () => {
  errors.value = {};
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  debtForm.value = {
    clientMode: 'new',
    clientId: '',
    clientName: '',
    clientPhone: '',
    amount: '',
    paidAmount: '',
    dueDate: '',
    description: '',
    paymentMode: 'later',
    installmentCount: 3,
    firstInstallmentDate: nextWeek.toISOString().split('T')[0],
    installmentFrequency: 'MONTHLY'
  };
  showDebtModal.value = true;
};

const closeDebtModal = () => {
  showDebtModal.value = false;
};

const createDebt = async () => {
  errors.value = {};
  const amount = Number(debtForm.value.amount || 0);
  const paidAmount = Number(debtForm.value.paidAmount || 0);
  const createsInstallments = debtForm.value.paymentMode === 'installments';

  if (debtForm.value.clientMode === 'existing' && !debtForm.value.clientId) {
    errors.value.clientId = 'Choisissez un client';
  }
  if (debtForm.value.clientMode === 'new' && !debtForm.value.clientName.trim()) {
    errors.value.clientName = 'Nom du client requis';
  }
  if (!amount || amount <= 0) errors.value.amount = 'Montant de la vente requis';
  if (paidAmount > amount) errors.value.paidAmount = 'L’acompte ne peut pas dépasser la dette';
  if (createsInstallments && (!debtForm.value.installmentCount || debtForm.value.installmentCount < 2)) {
    errors.value.installmentCount = 'Minimum 2 tranches';
  }
  if (createsInstallments && !debtForm.value.firstInstallmentDate) {
    errors.value.firstInstallmentDate = 'Date de première tranche requise';
  }

  if (Object.keys(errors.value).length > 0) return;

  try {
    loading.value = true;
    let clientId = debtForm.value.clientId;

    if (debtForm.value.clientMode === 'new') {
      const createdClient = await clientService.createClient({
        name: debtForm.value.clientName.trim(),
        phone: debtForm.value.clientPhone.trim(),
        status: 'active',
        totalDebt: 0
      });
      clientId = createdClient.id;
    }

    const createdDebt = await transactionService.createTransaction({
      clientId,
      amount,
      description: debtForm.value.description || 'Dette client',
      dueDate: debtForm.value.dueDate || null,
      status: 'pending',
      type: 'credit'
    });

    if (paidAmount > 0) {
      await transactionService.markAsPaid(createdDebt.id, {
        amount: paidAmount,
        description: 'Acompte'
      });
    }

    if (createsInstallments && amount > paidAmount) {
      await installmentService.createPlan(createdDebt.id, {
        count: debtForm.value.installmentCount,
        firstDueDate: debtForm.value.firstInstallmentDate,
        frequency: debtForm.value.installmentFrequency
      });
    }

    await loadData();
    emit('updated');
    closeDebtModal();
  } catch (error) {
    errors.value.general = getUserFriendlyError(error, 'save');
  } finally {
    loading.value = false;
  }
};

const openPaymentModal = (debt, installment = null) => {
  selectedDebt.value = debt;
  selectedInstallment.value = installment;
  paymentForm.value = {
    amount: installment?.remainingAmount || debt.remainingAmount || debt.amount,
    method: 'WAVE',
    reference: '',
    description: installment ? `Tranche ${installment.number}` : 'Paiement reçu'
  };
  errors.value = {};
  showPaymentModal.value = true;
};

const closePaymentModal = () => {
  showPaymentModal.value = false;
  selectedDebt.value = null;
  selectedInstallment.value = null;
};

const openPlanModal = (debt) => {
  selectedDebt.value = debt;
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);
  planForm.value = {
    count: 3,
    firstDueDate: nextWeek.toISOString().split('T')[0],
    frequency: 'MONTHLY'
  };
  errors.value = {};
  showPlanModal.value = true;
};

const closePlanModal = () => {
  showPlanModal.value = false;
  selectedDebt.value = null;
};

const createInstallmentPlan = async () => {
  if (!selectedDebt.value) return;
  errors.value = {};

  if (!planForm.value.count || planForm.value.count < 1) {
    errors.value.count = 'Nombre de tranches requis';
  }

  if (!planForm.value.firstDueDate) {
    errors.value.firstDueDate = 'Date de première tranche requise';
  }

  if (Object.keys(errors.value).length > 0) return;

  try {
    actionLoadingId.value = selectedDebt.value.id;
    await installmentService.createPlan(selectedDebt.value.id, planForm.value);
    await loadData();
    emit('updated');
    closePlanModal();
  } catch (error) {
    errors.value.general = getUserFriendlyError(error, 'save');
  } finally {
    actionLoadingId.value = null;
  }
};

const buildPaymentReference = () => {
  const label = paymentForm.value.description?.trim() || 'Paiement reçu';
  const proof = paymentForm.value.reference?.trim();
  return proof ? `${label} - Preuve: ${proof}` : label;
};

const collectPayment = async () => {
  if (!selectedDebt.value) return;
  errors.value = {};
  const amount = Number(paymentForm.value.amount || 0);

  if (!amount || amount <= 0) errors.value.amount = 'Montant requis';
  const remainingBalance = selectedInstallment.value?.remainingAmount || selectedDebt.value.remainingAmount;

  if (amount > remainingBalance) {
    errors.value.amount = 'Le paiement dépasse le solde restant';
  }

  if (Object.keys(errors.value).length > 0) return;

  try {
    actionLoadingId.value = selectedInstallment.value?.id || selectedDebt.value.id;
    const paymentPayload = {
      amount,
      method: paymentForm.value.method,
      reference: buildPaymentReference(),
      description: paymentForm.value.description
    };

    if (selectedInstallment.value) {
      await installmentService.payInstallment(selectedInstallment.value.id, paymentPayload);
    } else {
      await transactionService.markAsPaid(selectedDebt.value.id, paymentPayload);
    }

    await loadData();
    if (isExpanded(selectedDebt.value.id)) {
      await loadDebtTimeline(selectedDebt.value.id, true);
    }
    emit('updated');
    closePaymentModal();
  } catch (error) {
    errors.value.general = getUserFriendlyError(error, 'payment');
  } finally {
    actionLoadingId.value = null;
  }
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="bg-white rounded-lg border border-gray-200 overflow-hidden">
    <div class="p-4 sm:p-5 border-b border-gray-200">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 class="text-lg sm:text-xl font-bold text-gray-950">À récupérer</h2>
        </div>

        <button
          @click="openDebtModal"
          class="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors"
        >
          <Plus :size="18" />
          Ajouter une vente à crédit
        </button>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 mt-4">
        <div class="relative">
          <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher un client..."
            class="w-full pl-10 pr-4 py-3 sm:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div class="grid grid-cols-2 sm:flex gap-2">
          <button
            v-for="filter in statusFilters"
            :key="filter"
            @click="selectedStatus = filter"
            :class="[
              'rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors',
              selectedStatus === filter
                ? 'bg-gray-950 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            ]"
          >
            {{ filter }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="loading" class="p-6">
      <div class="animate-pulse space-y-3">
        <div v-for="i in 5" :key="i" class="h-16 bg-gray-200 rounded"></div>
      </div>
    </div>

    <div v-else-if="filteredDebts.length === 0" class="px-6 py-12 text-center">
      <CreditCard :size="40" class="text-gray-400 mx-auto mb-3" />
      <h3 class="text-lg font-medium text-gray-900 mb-1">Rien à afficher</h3>
      <p class="text-gray-600">Changez le filtre ou ajoutez une vente à crédit.</p>
    </div>

    <div v-else class="p-3 sm:p-4 space-y-3 sm:space-y-4">
      <article
        v-for="debt in filteredDebts"
        :key="debt.id"
        class="rounded-lg border border-gray-200 bg-white p-4"
      >
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <h3 class="text-lg font-bold text-gray-950 break-words">{{ debt.clientName }}</h3>
                  <span :class="['inline-flex px-2.5 py-1 rounded-full text-xs font-semibold', debt.statusColor]">
                    {{ debt.displayStatus }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 mt-1">{{ debt.clientPhone || 'Téléphone non renseigné' }}</p>
              </div>
              <div class="text-right shrink-0">
                <p class="text-xs font-semibold text-gray-500">Reste</p>
                <p class="text-xl font-black text-amber-700">{{ formatAmount(debt.remainingAmount) }}</p>
              </div>
            </div>

            <div class="mt-4">
              <div class="flex items-center justify-between text-sm">
                <span class="text-gray-600">Payé {{ formatAmount(debt.paidAmount) }} sur {{ formatAmount(debt.originalAmount) }}</span>
                <span class="font-semibold text-gray-900">{{ getProgressPercent(debt) }}%</span>
              </div>
              <div class="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                <div class="h-full rounded-full bg-teal-500" :style="{ width: `${getProgressPercent(debt)}%` }"></div>
              </div>
            </div>

            <div class="mt-3 grid gap-1 text-sm text-gray-600">
              <p>{{ debt.description || 'Vente à crédit' }}</p>
              <p class="flex items-center gap-2">
                <CalendarDays :size="15" />
                Échéance: {{ formatDate(debt.dueDate) }}
              </p>
              <p v-if="getNextInstallment(debt)" class="font-medium text-gray-800">
                Prochaine tranche: {{ formatAmount(getNextInstallment(debt).remainingAmount) }} le {{ formatDate(getNextInstallment(debt).dueDate) }}
              </p>
            </div>
          </div>

          <div class="lg:w-72">
            <div v-if="debt.remainingAmount > 0" class="grid gap-2">
              <button
                v-if="debt.installments.length === 0"
                @click="openPaymentModal(debt)"
                class="inline-flex items-center justify-center gap-2 rounded-lg border border-green-200 px-4 py-3 text-sm font-semibold text-green-700 hover:bg-green-50"
              >
                <Check :size="17" />
                Paiement reçu
              </button>
              <button
                v-if="debt.installments.length === 0"
                @click="openPlanModal(debt)"
                class="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-200 px-4 py-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                <ListChecks :size="17" />
                Découper en tranches
              </button>
            </div>

            <div v-else class="rounded-lg bg-green-50 px-4 py-3 text-sm font-semibold text-green-700 text-center">
              Dette totalement payée
            </div>
          </div>
        </div>

        <button
          @click="toggleDetails(debt.id)"
          class="mt-4 flex w-full items-center justify-between rounded-lg bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-100"
        >
          <span v-if="debt.installments.length > 0">
            Tranches et historique: {{ getInstallmentSummary(debt).paid }}/{{ getInstallmentSummary(debt).total }} payées
          </span>
          <span v-else>Historique</span>
          <ChevronDown :size="18" :class="['transition-transform', isExpanded(debt.id) ? 'rotate-180' : '']" />
        </button>

        <div v-if="isExpanded(debt.id)" class="mt-3 rounded-lg bg-gray-50 p-3">
          <div v-if="debt.installments.length > 0" class="space-y-2">
            <div
              v-for="installment in debt.installments"
              :key="installment.id"
              class="bg-white border border-gray-200 rounded-lg p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-semibold text-gray-950">Tranche {{ installment.number }} - {{ formatAmount(installment.amount) }}</p>
                  <p class="text-sm text-gray-600">Reste {{ formatAmount(installment.remainingAmount) }} - {{ formatDate(installment.dueDate) }}</p>
                </div>
                <span
                  :class="[
                    'inline-flex px-2 py-1 rounded-full text-xs font-semibold',
                    installment.status === 'PAYEE'
                      ? 'bg-green-100 text-green-700'
                      : installment.status === 'EN_RETARD'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                  ]"
                >
                  {{ installment.displayStatus }}
                </span>
              </div>
              <div v-if="installment.remainingAmount > 0" class="mt-3">
                <button
                  @click="openPaymentModal(debt, installment)"
                  :disabled="actionLoadingId === installment.id"
                  class="w-full px-3 py-2 border border-green-200 text-green-700 hover:bg-green-50 text-sm font-semibold rounded-lg disabled:opacity-60"
                >
                  Paiement reçu
                </button>
              </div>
            </div>
          </div>

          <div class="mt-4 rounded-lg bg-white p-3 ring-1 ring-gray-200">
            <div class="mb-3 flex items-center justify-between">
              <h4 class="text-sm font-black text-gray-950">Historique</h4>
              <span v-if="isTimelineLoading(debt.id)" class="text-xs font-semibold text-gray-500">Chargement...</span>
            </div>

            <div v-if="!isTimelineLoading(debt.id) && getDebtTimeline(debt.id).length === 0" class="text-sm text-gray-500">
              Aucun événement pour le moment.
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="event in getDebtTimeline(debt.id)"
                :key="event.id"
                class="grid grid-cols-[14px_1fr] gap-3"
              >
                <span :class="['mt-1.5 h-3 w-3 rounded-full', timelineTypeClass(event.type)]"></span>
                <div class="min-w-0 border-b border-gray-100 pb-3 last:border-b-0 last:pb-0">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <p class="font-semibold text-gray-950">{{ event.title }}</p>
                    <span class="text-xs font-semibold text-gray-500">{{ formatTimelineDate(event.occurredAt) }}</span>
                  </div>
                  <p class="mt-1 text-sm text-gray-600 break-words">{{ event.description }}</p>
                  <div class="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold">
                    <span v-if="event.amount" class="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                      {{ formatAmount(event.amount) }}
                    </span>
                    <span v-if="event.status" class="rounded-full bg-gray-100 px-2 py-1 text-gray-700">
                      {{ timelineStatusLabel(event.status) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>

    <div v-if="showDebtModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div class="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
        <div class="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-900">Nouvelle vente à crédit</h2>
          <button @click="closeDebtModal" class="p-2 hover:bg-gray-100 rounded-lg">
            <X :size="20" class="text-gray-500" />
          </button>
        </div>

        <form @submit.prevent="createDebt" class="p-4 sm:p-6 space-y-4">
          <div v-if="errors.general" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {{ errors.general }}
          </div>

          <section class="rounded-xl border border-gray-200 p-4">
            <h3 class="font-bold text-gray-950 mb-3">1. Client</h3>
            <div class="grid grid-cols-2 gap-2 mb-4">
              <button
                type="button"
                @click="debtForm.clientMode = 'new'"
                :class="[
                  'rounded-lg border px-3 py-3 text-sm font-semibold',
                  debtForm.clientMode === 'new'
                    ? 'border-teal-400 bg-teal-50 text-teal-800'
                    : 'border-gray-200 text-gray-700'
                ]"
              >
                Nouveau
              </button>
              <button
                type="button"
                @click="debtForm.clientMode = 'existing'"
                :class="[
                  'rounded-lg border px-3 py-3 text-sm font-semibold',
                  debtForm.clientMode === 'existing'
                    ? 'border-teal-400 bg-teal-50 text-teal-800'
                    : 'border-gray-200 text-gray-700'
                ]"
              >
                Existant
              </button>
            </div>

            <div v-if="debtForm.clientMode === 'new'" class="space-y-3">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Nom du client</label>
                <input
                  v-model.trim="debtForm.clientName"
                  type="text"
                  placeholder="Ex: Awa Diop"
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <p v-if="errors.clientName" class="text-xs text-red-600 mt-1">{{ errors.clientName }}</p>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Téléphone</label>
                <input
                  v-model.trim="debtForm.clientPhone"
                  type="tel"
                  placeholder="Ex: 77 000 00 00"
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div v-else>
              <label class="block text-sm font-semibold text-gray-700 mb-2">Choisir le client</label>
              <select v-model="debtForm.clientId" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="">Choisir un client</option>
                <option v-for="client in clients" :key="client.id" :value="client.id">{{ client.name }}{{ client.phone ? ` - ${client.phone}` : '' }}</option>
              </select>
              <p v-if="errors.clientId" class="text-xs text-red-600 mt-1">{{ errors.clientId }}</p>
            </div>
          </section>

          <section class="rounded-xl border border-gray-200 p-4">
            <h3 class="font-bold text-gray-950 mb-3">2. Dette</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Montant total</label>
                <input v-model="debtForm.amount" type="number" min="1" placeholder="Ex: 10000" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <p v-if="errors.amount" class="text-xs text-red-600 mt-1">{{ errors.amount }}</p>
              </div>
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Acompte reçu</label>
                <input v-model="debtForm.paidAmount" type="number" min="0" placeholder="0" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <p v-if="errors.paidAmount" class="text-xs text-red-600 mt-1">{{ errors.paidAmount }}</p>
              </div>
            </div>

            <div class="mt-4">
              <label class="block text-sm font-semibold text-gray-700 mb-2">Date limite</label>
              <input v-model="debtForm.dueDate" type="date" :min="today" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>

            <div class="mt-4">
              <label class="block text-sm font-semibold text-gray-700 mb-2">Note</label>
              <input v-model="debtForm.description" type="text" placeholder="Ex: Téléphone, marchandise, facture..." class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
            </div>
          </section>

          <section class="rounded-xl border border-gray-200 p-4">
            <h3 class="font-bold text-gray-950 mb-3">3. Paiement prévu</h3>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="debtForm.paymentMode = 'later'"
                :class="[
                  'rounded-lg border px-3 py-3 text-sm font-semibold',
                  debtForm.paymentMode === 'later'
                    ? 'border-teal-400 bg-teal-50 text-teal-800'
                    : 'border-gray-200 text-gray-700'
                ]"
              >
                Une seule fois
              </button>
              <button
                type="button"
                @click="debtForm.paymentMode = 'installments'"
                :class="[
                  'rounded-lg border px-3 py-3 text-sm font-semibold',
                  debtForm.paymentMode === 'installments'
                    ? 'border-teal-400 bg-teal-50 text-teal-800'
                    : 'border-gray-200 text-gray-700'
                ]"
              >
                En tranches
              </button>
            </div>

            <div v-if="debtForm.paymentMode === 'installments'" class="mt-4 space-y-4">
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre de tranches</label>
                <input v-model.number="debtForm.installmentCount" type="number" min="2" max="24" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <p v-if="errors.installmentCount" class="text-xs text-red-600 mt-1">{{ errors.installmentCount }}</p>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Première date de paiement</label>
                <input v-model="debtForm.firstInstallmentDate" type="date" :min="today" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <p v-if="errors.firstInstallmentDate" class="text-xs text-red-600 mt-1">{{ errors.firstInstallmentDate }}</p>
              </div>

              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-2">Fréquence</label>
                <select v-model="debtForm.installmentFrequency" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
                  <option value="WEEKLY">Chaque semaine</option>
                  <option value="MONTHLY">Chaque mois</option>
                  <option value="DAILY">Chaque jour</option>
                </select>
              </div>
            </div>
          </section>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <button type="button" @click="closeDebtModal" class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">Annuler</button>
            <button type="submit" class="flex-1 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl">Créer la vente</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showPaymentModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div class="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full max-h-[92vh] overflow-y-auto">
        <div class="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-900">Paiement reçu</h2>
          <button @click="closePaymentModal" class="p-2 hover:bg-gray-100 rounded-lg">
            <X :size="20" class="text-gray-500" />
          </button>
        </div>

        <form @submit.prevent="collectPayment" class="p-4 sm:p-6 space-y-4">
          <div v-if="errors.general" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {{ errors.general }}
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p class="font-semibold text-gray-900">{{ selectedDebt?.clientName }}</p>
            <p class="text-sm text-gray-600">
              {{ selectedInstallment ? `Tranche ${selectedInstallment.number}` : 'Solde restant' }} :
              {{ formatAmount(selectedInstallment?.remainingAmount || selectedDebt?.remainingAmount) }}
            </p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Montant reçu</label>
            <input v-model="paymentForm.amount" type="number" min="1" :max="selectedInstallment?.remainingAmount || selectedDebt?.remainingAmount" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <p v-if="errors.amount" class="text-xs text-red-600 mt-1">{{ errors.amount }}</p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Reçu par</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="method in paymentMethods"
                :key="method.value"
                type="button"
                @click="paymentForm.method = method.value"
                :class="[
                  'flex min-h-[86px] flex-col items-center justify-center gap-2 rounded-lg border px-2 py-3 text-sm font-bold',
                  paymentForm.method === method.value
                    ? 'border-teal-500 bg-teal-50 text-teal-700'
                    : 'border-gray-200 text-gray-700'
                ]"
              >
                <MobileMoneyIcon
                  v-if="method.iconOperator"
                  :operator="method.iconOperator"
                  size="sm"
                />
                <span v-else class="flex h-9 w-14 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700">
                  <Banknote :size="20" />
                </span>
                <span class="leading-tight">{{ method.label }}</span>
              </button>
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Référence (optionnel)</label>
            <input
              v-model.trim="paymentForm.reference"
              type="text"
              placeholder="Ex: ID transaction Wave ou Orange Money"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p class="mt-1 text-xs font-semibold text-gray-500">
              Laissez vide si vous avez déjà vérifié l’argent sur votre téléphone.
            </p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Note</label>
            <input
              v-model.trim="paymentForm.description"
              type="text"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <button type="button" @click="closePaymentModal" class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">Annuler</button>
            <button type="submit" class="flex-1 px-4 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl">Enregistrer</button>
          </div>
        </form>
      </div>
    </div>

    <div v-if="showPlanModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div class="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl max-w-md w-full max-h-[92vh] overflow-y-auto">
        <div class="sticky top-0 bg-white flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-900">Créer les tranches</h2>
          <button @click="closePlanModal" class="p-2 hover:bg-gray-100 rounded-lg">
            <X :size="20" class="text-gray-500" />
          </button>
        </div>

        <form @submit.prevent="createInstallmentPlan" class="p-4 sm:p-6 space-y-4">
          <div v-if="errors.general" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {{ errors.general }}
          </div>

          <div class="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p class="font-semibold text-gray-900">{{ selectedDebt?.clientName }}</p>
            <p class="text-sm text-gray-600">À répartir : {{ formatAmount(selectedDebt?.remainingAmount) }}</p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Nombre de tranches</label>
            <input v-model.number="planForm.count" type="number" min="1" max="24" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <p v-if="errors.count" class="text-xs text-red-600 mt-1">{{ errors.count }}</p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Première date de paiement</label>
            <input v-model="planForm.firstDueDate" type="date" :min="today" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <p v-if="errors.firstDueDate" class="text-xs text-red-600 mt-1">{{ errors.firstDueDate }}</p>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-2">Fréquence</label>
            <select v-model="planForm.frequency" class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="WEEKLY">Chaque semaine</option>
              <option value="MONTHLY">Chaque mois</option>
              <option value="DAILY">Chaque jour</option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
            <button type="button" @click="closePlanModal" class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50">Annuler</button>
            <button type="submit" class="flex-1 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl">Créer</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>
