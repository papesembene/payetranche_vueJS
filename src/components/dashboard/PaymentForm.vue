<script setup>
import { ref, computed, watch } from 'vue';
import { Calendar, DollarSign, CreditCard, Plus, X, AlertCircle } from 'lucide-vue-next';
import { transactionService } from '../../services/transaction.service.js';
import { clientService } from '../../services/client.service.js';
import { useUserStore } from '../../stores/user.js';
import { useUser } from '../../composables/useUser.js';

const userStore = useUserStore();
const { syncUsageCounts } = useUser();

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  client: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['close', 'saved']);

const loading = ref(false);
const clientTransactions = ref([]);

const paymentData = ref({
  amount: '',
  description: '',
  dueDate: '',
  isInstallment: false,
  installmentCount: 1,
  installmentAmount: '',
  frequency: 'monthly' // monthly, weekly, daily
});

const errors = ref({});

// Charger les transactions du client
const loadClientTransactions = async () => {
  if (!props.client?.id) return;
  try {
    const transactions = await transactionService.getTransactions();
    clientTransactions.value = transactions.filter(t => t.clientId === props.client.id);
  } catch (error) {
    console.error('Erreur chargement transactions:', error);
    clientTransactions.value = [];
  }
};

// Watch pour charger les transactions quand le formulaire s'ouvre
watch(() => props.show, async (show) => {
  if (show) {
    await loadClientTransactions();
  }
});

// Vérifier s'il y a des paiements en attente
const hasPendingPayments = computed(() => {
  return clientTransactions.value.some(t => t.status === 'pending');
});

// Nombre de paiements en attente
const pendingPaymentsCount = computed(() => {
  return clientTransactions.value.filter(t => t.status === 'pending').length;
});

// Helper function to parse formatted amount
const parseFormattedAmount = (formattedAmount) => {
  if (typeof formattedAmount === 'string') {
    // Remove ' FCFA' and spaces, then parse as number
    const cleaned = formattedAmount.replace(' FCFA', '').replace(/\s+/g, '').trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return Number(formattedAmount) || 0;
};

// Computed properties
const remainingDebt = computed(() => {
  if (!props.client) return 0;

  // Always calculate from total and paid to ensure accuracy
  const totalDebt = parseFormattedAmount(props.client.total) || parseFormattedAmount(props.client.totalDebt) || 0;
  const paid = parseFormattedAmount(props.client.paid) || 0;
  const remaining = totalDebt - paid;

  return Math.max(0, remaining); // Ensure never negative
});

const canAddPayment = computed(() => {
  return userStore.canAddPayment && remainingDebt.value > 0;
});

const installmentOptions = computed(() => {
  const options = [];
  const maxInstallments = Math.min(12, Math.floor(remainingDebt.value / 1000)); // Max 12 tranches, min 1000 FCFA

  // Start from 1 tranche when installments are enabled
  for (let i = 1; i <= maxInstallments; i++) {
    options.push({
      value: i,
      label: i === 1 ? '1 tranche (paiement simple)' : `${i} tranches`,
      amount: Math.ceil(remainingDebt.value / i)
    });
  }
  return options;
});

const totalInstallmentAmount = computed(() => {
  if (!paymentData.value.isInstallment || !paymentData.value.installmentCount) return 0;
  return Math.ceil(remainingDebt.value / paymentData.value.installmentCount);
});

const frequencyOptions = [
  { value: 'daily', label: 'Quotidienne' },
  { value: 'weekly', label: 'Hebdomadaire' },
  { value: 'monthly', label: 'Mensuelle' }
];

// Reactive amount calculation for installments
const installmentAmount = computed(() => {
  if (paymentData.value.isInstallment) {
    return totalInstallmentAmount.value.toString();
  }
  return paymentData.value.amount;
});

// Methods
const validateForm = () => {
  errors.value = {};

  // Vérifier s'il y a déjà des paiements en attente
  if (hasPendingPayments.value) {
    errors.general = `Vous avez déjà ${pendingPaymentsCount.value} paiement(s) en attente pour ce client. Marquez-les comme payés avant d'ajouter de nouveaux paiements.`;
    return false;
  }

  // For installments, amount is calculated automatically, so no need to validate user input
  if (!paymentData.value.isInstallment) {
    if (!paymentData.value.amount || paymentData.value.amount <= 0) {
      errors.value.amount = 'Le montant est requis';
    }

    if (parseFloat(paymentData.value.amount) > remainingDebt.value) {
      errors.value.amount = `Le montant ne peut pas dépasser ${remainingDebt.value.toLocaleString('fr-FR')} FCFA`;
    }
  }

  // Due date is required only for installment payments
  if (paymentData.value.isInstallment && !paymentData.value.dueDate) {
    errors.value.dueDate = "La date d'échéance est requise pour les paiements échelonnés";
  }

  // Validate due date if provided
  if (paymentData.value.dueDate) {
    const dueDate = new Date(paymentData.value.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dueDate < today) {
      errors.value.dueDate = "La date d'échéance ne peut pas être dans le passé";
    }
  }

  return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
  if (!validateForm()) return;

  loading.value = true;
  try {
    if (paymentData.value.isInstallment && paymentData.value.installmentCount > 1) {
      // Créer plusieurs transactions pour les tranches
      await createInstallments();
    } else {
      // Créer une transaction simple
      await createSinglePayment();
    }

    // Synchronize with actual completed payments count from database
    // (new payments are 'pending', only 'completed' ones count toward usage limit)
    await syncUsageCounts();

    emit('saved');
    closeForm();
  } catch (error) {
    console.error('Erreur création paiement:', error);
    errors.value.general = error.message || 'Erreur lors de la création du paiement';
  } finally {
    loading.value = false;
  }
};

const createSinglePayment = async () => {
  // Use calculated amount for installments with 1 tranche, otherwise use user input
  const amount = paymentData.value.isInstallment
    ? totalInstallmentAmount.value
    : parseFloat(paymentData.value.amount);

  // Pour les paiements simples (sans tranches), marquer comme payé
  // Pour les tranches ou paiements avec date d'échéance, marquer comme en attente
  const status = paymentData.value.isInstallment ? 'pending' : 'completed';

  await transactionService.createTransaction({
    clientId: props.client.id,
    amount: amount,
    description: paymentData.value.description || 'Paiement',
    dueDate: paymentData.value.dueDate || null,
    status: status,
    type: 'payment'
  });
};

const createInstallments = async () => {
  const installmentAmount = totalInstallmentAmount.value;
  const baseDate = new Date(paymentData.value.dueDate);
  const transactions = [];

  for (let i = 0; i < paymentData.value.installmentCount; i++) {
    const dueDate = new Date(baseDate);

    // Calculer la date selon la fréquence
    switch (paymentData.value.frequency) {
      case 'daily':
        dueDate.setDate(baseDate.getDate() + i);
        break;
      case 'weekly':
        dueDate.setDate(baseDate.getDate() + (i * 7));
        break;
      case 'monthly':
        dueDate.setMonth(baseDate.getMonth() + i);
        break;
    }

    transactions.push({
      clientId: props.client.id,
      amount: installmentAmount,
      description: `${paymentData.value.description || 'Paiement échelonné'} - Tranche ${i + 1}/${paymentData.value.installmentCount}`,
      dueDate: dueDate.toISOString().split('T')[0],
      status: 'pending',
      type: 'payment',
      installmentInfo: {
        totalInstallments: paymentData.value.installmentCount,
        currentInstallment: i + 1,
        frequency: paymentData.value.frequency
      }
    });
  }

  // Créer toutes les transactions
  for (const transaction of transactions) {
    await transactionService.createTransaction(transaction);
  }
};

const closeForm = () => {
  paymentData.value = {
    amount: '',
    description: '',
    dueDate: '',
    isInstallment: false,
    installmentCount: 1,
    installmentAmount: '',
    frequency: 'monthly'
  };
  errors.value = {};
  emit('close');
};

const formatAmount = (amount) => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

// Get today's date for min date
const today = new Date().toISOString().split('T')[0];
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" style="z-index: 1000;">
    <div class="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-bold text-gray-900">Ajouter un paiement</h2>
        <button @click="closeForm" class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <X :size="20" class="text-gray-500" />
        </button>
      </div>

      <!-- Client Info -->
      <div class="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
            <span class="text-white font-semibold">{{ client.name.charAt(0).toUpperCase() }}</span>
          </div>
          <div>
            <h3 class="font-semibold text-gray-900">{{ client.name }}</h3>
            <p class="text-sm text-gray-600">Dette restante: {{ formatAmount(remainingDebt) }}</p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="p-6 space-y-6">
        <!-- Warning for pending payments -->
        <div v-if="hasPendingPayments" class="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div class="flex items-start gap-3">
            <AlertCircle :size="20" class="text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="font-medium text-amber-800">Paiement(s) en attente</p>
              <p class="text-sm text-amber-700 mt-1">
                Vous avez {{ pendingPaymentsCount }} paiement(s) en attente pour ce client.
                Marquez-les comme payés avant d'ajouter de nouveaux paiements.
              </p>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errors.general && !hasPendingPayments" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          {{ errors.general }}
        </div>

        <!-- Amount -->
        <div>
          <label for="amount" class="block text-sm font-semibold text-gray-700 mb-2">
            Montant du paiement
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <DollarSign :size="20" class="text-gray-400" />
            </div>
            <input
              id="amount"
              v-model="paymentData.amount"
              type="number"
              step="0.01"
              min="0"
              :max="remainingDebt"
              placeholder="0.00"
              :class="['w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent', errors.amount ? 'border-red-500' : 'border-gray-300']"
              :disabled="paymentData.isInstallment"
            />
          </div>
          <p v-if="errors.amount" class="text-xs text-red-600 mt-1">{{ errors.amount }}</p>
          <p v-if="paymentData.isInstallment" class="text-xs text-gray-500 mt-1">
            Montant calculé automatiquement pour {{ paymentData.installmentCount }} tranches
          </p>
        </div>

        <!-- Due Date -->
        <div>
          <label for="dueDate" class="block text-sm font-semibold text-gray-700 mb-2">
            Date d'échéance{{ paymentData.isInstallment ? '' : ' (optionnel)' }}
          </label>
          <div class="relative">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Calendar :size="20" class="text-gray-400" />
            </div>
            <input
              id="dueDate"
              v-model="paymentData.dueDate"
              type="date"
              :min="today"
              :class="['w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent', errors.dueDate ? 'border-red-500' : 'border-gray-300']"
            />
          </div>
          <p v-if="errors.dueDate" class="text-xs text-red-600 mt-1">{{ errors.dueDate }}</p>
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-semibold text-gray-700 mb-2">
            Description (optionnel)
          </label>
          <input
            id="description"
            v-model="paymentData.description"
            type="text"
            placeholder="Ex: Paiement partiel, acompte..."
            class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        <!-- Installment Toggle -->
        <div class="border-t border-gray-200 pt-6">
          <label class="flex items-center gap-3 cursor-pointer">
            <input
              v-model="paymentData.isInstallment"
              type="checkbox"
              class="w-5 h-5 text-teal-500 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
            />
            <span class="text-sm font-semibold text-gray-700">Paiement échelonné (tranches)</span>
          </label>
        </div>

        <!-- Installment Options -->
        <div v-if="paymentData.isInstallment" class="space-y-4 pl-8 border-l-2 border-teal-200">
          <!-- Number of Installments -->
          <div>
            <label for="installmentCount" class="block text-sm font-semibold text-gray-700 mb-2">
              Nombre de tranches
            </label>
            <select
              id="installmentCount"
              v-model="paymentData.installmentCount"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option v-for="option in installmentOptions" :key="option.value" :value="option.value">
                {{ option.label }} ({{ formatAmount(option.amount) }} chacune)
              </option>
            </select>
          </div>

          <!-- Frequency -->
          <div>
            <label for="frequency" class="block text-sm font-semibold text-gray-700 mb-2">
              Fréquence
            </label>
            <select
              id="frequency"
              v-model="paymentData.frequency"
              class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            >
              <option v-for="option in frequencyOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </div>

          <!-- Summary -->
          <div class="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <h4 class="font-semibold text-teal-800 mb-2">Résumé des tranches</h4>
            <div class="space-y-1 text-sm text-teal-700">
              <p>{{ paymentData.installmentCount }} tranches de {{ formatAmount(totalInstallmentAmount) }}</p>
              <p>Total: {{ formatAmount(remainingDebt) }}</p>
              <p>Fréquence: {{ frequencyOptions.find(o => o.value === paymentData.frequency)?.label }}</p>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3 pt-6 border-t border-gray-200">
          <button
            type="button"
            @click="closeForm"
            class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Annuler
          </button>
          <button
            type="submit"
            :disabled="loading || !canAddPayment || hasPendingPayments"
            class="flex-1 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Création en cours...' : paymentData.isInstallment && paymentData.installmentCount > 1 ? 'Créer les tranches' : 'Créer le paiement' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
