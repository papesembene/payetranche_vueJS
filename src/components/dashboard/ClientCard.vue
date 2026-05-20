<script setup>
import { ref } from 'vue';
import { Phone, History, X, Check, Clock, AlertTriangle } from 'lucide-vue-next';
import { installmentService } from '../../services/installment.service.js';
import { transactionService } from '../../services/transaction.service.js';
import { safeFormatDate } from '../../utils/export.js';

const props = defineProps({
  client: {
    type: Object,
    required: true
  }
});

const showHistoryModal = ref(false);
const clientTransactions = ref([]);
const loading = ref(false);

const openHistoryModal = async () => {
  showHistoryModal.value = true;
  await loadClientTransactions();
};

const closeHistoryModal = () => {
  showHistoryModal.value = false;
  clientTransactions.value = [];
};

const loadClientTransactions = async () => {
  if (loading.value) return;
  try {
    loading.value = true;
    const [transactions, installments] = await Promise.all([
      transactionService.getTransactionsByClient(props.client.id),
      installmentService.getInstallments({ clientId: props.client.id })
    ]);

    const payments = transactions.filter(transaction => transaction.backendType === 'payment');
    const installmentsByCredit = new Map();
    installments.forEach((installment) => {
      const current = installmentsByCredit.get(installment.creditId) || [];
      current.push(installment);
      installmentsByCredit.set(installment.creditId, current);
    });

    clientTransactions.value = transactions
      .filter(transaction => transaction.backendType === 'credit')
      .map((credit) => ({
        ...credit,
        payments: payments.filter(payment => payment.creditId === credit.id),
        installments: installmentsByCredit.get(credit.id) || []
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  } catch (error) {
    console.error('Erreur chargement historique:', error);
    clientTransactions.value = [];
  } finally {
    loading.value = false;
  }
};

const formatAmount = (amount) => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

const formatDate = (dateString) => {
  const date = safeFormatDate(dateString);
  if (date === 'Date invalide' || date === 'Date inconnue') return date;
  
  let dateObj;
  // Gérer les Timestamps Firestore (objets avec toDate())
  if (dateString && typeof dateString === 'object' && dateString.toDate) {
    dateObj = dateString.toDate();
  } else if (typeof dateString === 'number') {
    dateObj = new Date(dateString);
  } else {
    dateObj = new Date(dateString);
  }
  
  return dateObj.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'completed':
      return Check;
    case 'pending':
      return Clock;
    default:
      return AlertTriangle;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'pending':
      return 'text-blue-600 bg-blue-100';
    default:
      return 'text-red-600 bg-red-100';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'completed':
      return 'Payé';
    case 'pending':
      return 'En cours';
    default:
      return 'En retard';
  }
};

const transactionAmountLabel = (transaction) => {
  return transaction.backendType === 'credit' ? 'Montant initial' : 'Montant reçu';
};

const transactionAmount = (transaction) => {
  return transaction.backendType === 'credit'
    ? transaction.originalAmount || transaction.amount
    : transaction.amount;
};
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
    <!-- Header -->
    <div class="flex items-start justify-between mb-4">
      <h3 class="text-lg font-bold text-gray-900">{{ client.name }}</h3>
      <span :class="['inline-flex px-3 py-1 rounded-full text-xs font-semibold', client.statusColor]">
        {{ client.status }}
      </span>
    </div>

    <!-- Contact Info -->
    <div class="space-y-2 mb-4">
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <Phone :size="16" />
        <span>{{ client.phone }}</span>
      </div>
      <div class="flex items-center gap-2 text-sm text-gray-600">
        <span class="font-medium">📍</span>
        <span>{{ client.address }}</span>
      </div>
    </div>

    <!-- Payment Details -->
    <div class="space-y-3 mb-4 pt-4 border-t border-gray-200">
      <div class="flex justify-between text-sm">
        <span class="text-gray-600">Total</span>
        <span class="font-semibold text-gray-900">{{ client.total }}</span>
      </div>
      <div v-if="client.acompte && parseInt(client.acompte.replace(/\s|FCFA/g, '')) > 0" class="flex justify-between text-sm">
        <span class="text-gray-600">Acompte</span>
        <span class="font-semibold text-blue-600">{{ client.acompte }}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-gray-600">Payé</span>
        <span class="font-semibold text-green-600">{{ client.paid }}</span>
      </div>
      <div class="flex justify-between text-sm">
        <span class="text-gray-600">Restant</span>
        <span class="font-semibold text-orange-600">{{ client.remaining }}</span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div class="mb-4">
      <div class="flex justify-between text-xs text-gray-600 mb-2">
        <span>Progression</span>
        <span class="font-semibold">{{ client.progress }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-2">
        <div
          :style="{ width: client.progress + '%' }"
          class="bg-teal-500 h-2 rounded-full transition-all duration-300"
        ></div>
      </div>
    </div>

    <!-- Actions -->
    <div class="space-y-2">
      <button
        @click="openHistoryModal"
        class="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors"
      >
        <History :size="18" />
        Voir l'historique ({{ client.historyCount }})
      </button>
    </div>

    <!-- History Modal -->
    <div v-if="showHistoryModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style="z-index: 1000;">
      <div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 class="text-xl font-bold text-gray-900">Crédits de {{ client.name }}</h2>
          <button @click="closeHistoryModal" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X :size="20" class="text-gray-500" />
          </button>
        </div>

        <!-- Content -->
        <div class="p-6">
          <div v-if="loading" class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
          </div>

          <div v-else-if="clientTransactions.length === 0" class="text-center py-8">
            <History :size="48" class="text-gray-400 mx-auto mb-4" />
            <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun crédit</h3>
            <p class="text-gray-600">Ce client n’a rien pris à crédit.</p>
          </div>

          <div v-else class="space-y-4 max-h-96 overflow-y-auto">
            <div
              v-for="transaction in clientTransactions"
              :key="transaction.id"
              class="bg-gray-50 rounded-xl p-4 border border-gray-200"
            >
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div :class="['w-10 h-10 rounded-full flex items-center justify-center', getStatusColor(transaction.status)]">
                    <component :is="getStatusIcon(transaction.status)" :size="20" />
                  </div>
                  <div>
                    <h4 class="font-semibold text-gray-900">{{ transaction.description || 'Crédit client' }}</h4>
                    <p class="text-sm text-gray-600">{{ formatDate(transaction.createdAt) }}</p>
                  </div>
                </div>
                <span :class="['inline-flex px-3 py-1 rounded-full text-xs font-semibold', getStatusColor(transaction.status)]">
                  {{ getStatusText(transaction.status) }}
                </span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <p class="text-sm text-gray-600">{{ transactionAmountLabel(transaction) }}</p>
                  <p class="font-semibold text-gray-900">{{ formatAmount(transactionAmount(transaction)) }}</p>
                </div>
                <div v-if="transaction.backendType === 'credit'">
                  <p class="text-sm text-gray-600">Payé</p>
                  <p class="font-semibold text-green-600">{{ formatAmount(transaction.paidAmount || 0) }}</p>
                </div>
                <div v-if="transaction.backendType === 'credit'">
                  <p class="text-sm text-gray-600">Reste</p>
                  <p class="font-semibold text-orange-600">{{ formatAmount(transaction.remainingAmount || 0) }}</p>
                </div>
                <div v-if="transaction.dueDate" class="sm:col-span-3">
                  <p class="text-sm text-gray-600">Échéance</p>
                  <p class="font-medium text-gray-700">{{ formatDate(transaction.dueDate) }}</p>
                </div>
              </div>

              <div v-if="transaction.paymentDate" class="mt-3 pt-3 border-t border-gray-200">
                <p class="text-xs text-gray-500">
                  Payé le {{ formatDate(transaction.paymentDate) }}
                </p>
              </div>

              <div v-if="transaction.installments.length > 0" class="mt-4 pt-4 border-t border-gray-200">
                <p class="text-sm font-semibold text-gray-800 mb-2">Tranches prévues</p>
                <div class="space-y-2">
                  <div
                    v-for="installment in transaction.installments"
                    :key="installment.id"
                    class="flex items-center justify-between gap-3 bg-white rounded-lg border border-gray-200 p-3"
                  >
                    <div>
                      <p class="font-medium text-gray-900">Tranche {{ installment.number }}</p>
                      <p class="text-xs text-gray-600">{{ formatDate(installment.dueDate) }}</p>
                    </div>
                    <div class="text-right">
                      <p class="font-semibold text-gray-900">{{ formatAmount(installment.amount) }}</p>
                      <p :class="['text-xs font-medium', installment.remainingAmount > 0 ? 'text-orange-600' : 'text-green-600']">
                        Reste {{ formatAmount(installment.remainingAmount) }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="transaction.payments.length > 0" class="mt-4 pt-4 border-t border-gray-200">
                <p class="text-sm font-semibold text-gray-800 mb-2">Paiements reçus</p>
                <div class="space-y-2">
                  <div
                    v-for="payment in transaction.payments"
                    :key="payment.id"
                    class="flex items-center justify-between gap-3 bg-green-50 rounded-lg border border-green-100 p-3"
                  >
                    <div>
                      <p class="font-medium text-green-900">{{ payment.description || 'Paiement reçu' }}</p>
                      <p class="text-xs text-green-700">{{ formatDate(payment.paymentDate || payment.createdAt) }}</p>
                    </div>
                    <p class="font-semibold text-green-700">{{ formatAmount(payment.amount) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
