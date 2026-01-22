<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Search, ChevronDown, Eye, Pencil, Trash2, Download, FileText, FileSpreadsheet, Check } from 'lucide-vue-next';
import { transactionService } from '../../services/transaction.service.js';
import { clientService } from '../../services/client.service.js';
import { exportPaymentsToExcel, exportTransactionHistory, generateReportPDF } from '../../utils/export.js';

const props = defineProps({
  refresh: {
    type: Number,
    default: 0
  }
});

const searchQuery = ref('');
const selectedStatus = ref('Tous les statuts');
const transactions = ref([]);
const clients = ref([]);
const loading = ref(false);
const showExportMenu = ref(false);

// Watch for refresh prop changes
watch(() => props.refresh, () => {
  loadData();
});

const loadData = async () => {
  if (loading.value) return; // Prevent multiple simultaneous calls
  try {
    loading.value = true;
    const [transactionsData, clientsData] = await Promise.all([
      transactionService.getTransactions(),
      clientService.getClients()
    ]);

    transactions.value = transactionsData;
    clients.value = clientsData;
  } catch (error) {
    console.error('Erreur chargement paiements:', error);
    transactions.value = [];
    clients.value = [];
  } finally {
    loading.value = false;
  }
};

// Transformer les transactions pour l'affichage
const payments = computed(() => {
  const clientsMap = new Map(clients.value.map(c => [c.id, c]));

  return transactions.value.map(transaction => {
    const client = clientsMap.get(transaction.clientId);
    const clientName = client?.name || 'Client inconnu';
    const avatar = clientName.charAt(0).toUpperCase();

    // Déterminer le statut
    let status = 'En cours';
    let statusColor = 'bg-blue-100 text-blue-700';

    if (transaction.status === 'completed') {
      status = 'Payé';
      statusColor = 'bg-green-100 text-green-700';
    } else if (transaction.status === 'pending' && new Date(transaction.dueDate) < new Date()) {
      status = 'En retard';
      statusColor = 'bg-red-100 text-red-700';
    }

    // Calculer la tranche
    const tranche = transaction.installmentInfo
      ? `${transaction.installmentInfo.currentInstallment}/${transaction.installmentInfo.totalInstallments}`
      : '1/1';

    return {
      id: transaction.id,
      client: clientName,
      avatar,
      avatarColor: 'bg-teal-500',
      amount: formatAmount(transaction.amount),
      tranche,
      date: formatDate(transaction.createdAt),
      status,
      statusColor,
      rawStatus: transaction.status
    };
  });
});

// Filtrage des paiements
const filteredPayments = computed(() => {
  let filtered = payments.value;

  // Filtre par recherche
  if (searchQuery.value) {
    filtered = filtered.filter(payment =>
      payment.client.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  // Filtre par statut
  if (selectedStatus.value !== 'Tous les statuts') {
    filtered = filtered.filter(payment => payment.status === selectedStatus.value);
  }

  return filtered;
});

const formatAmount = (amount) => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

// Export functions
const exportPaymentsExcel = () => {
  showExportMenu.value = false;
  if (filteredPayments.value.length === 0) {
    alert('Aucun paiement à exporter');
    return;
  }
  exportPaymentsToExcel(filteredPayments.value, `paiements-${new Date().toISOString().split('T')[0]}`);
};

const exportPaymentsPDF = () => {
  showExportMenu.value = false;
  if (filteredPayments.value.length === 0) {
    alert('Aucun paiement à exporter');
    return;
  }
  generateReportPDF('Liste des Paiements', filteredPayments.value, `paiements-${new Date().toISOString().split('T')[0]}`);
};

const exportTransactionHistoryFull = () => {
  showExportMenu.value = false;
  if (transactions.value.length === 0) {
    alert('Aucune transaction à exporter');
    return;
  }
  // Add client names to transactions
  const clientsMap = new Map(clients.value.map(c => [c.id, c.name]));
  const transactionsWithNames = transactions.value.map(t => ({
    ...t,
    clientName: clientsMap.get(t.clientId) || 'Client inconnu'
  }));
  exportTransactionHistory(transactionsWithNames, `historique-${new Date().toISOString().split('T')[0]}`);
};

// Mark transaction as completed
const markAsCompleted = async (transactionId) => {
  try {
    await transactionService.markAsPaid(transactionId);
    // Refresh data
    await loadData();
    // Emit event to refresh other components
    emit('updated');
  } catch (error) {
    console.error('Erreur marquage paiement:', error);
    alert('Erreur lors de la mise à jour du paiement');
  }
};

// Close export menu when clicking outside
const closeExportMenu = () => {
  showExportMenu.value = false;
};

const emit = defineEmits(['updated']);

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm" @click="closeExportMenu">
    <!-- Header -->
    <div class="p-6 border-b border-gray-200">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 class="text-xl font-bold text-gray-900">Liste des paiements</h2>
        
        <div class="flex flex-col gap-3">
          <!-- Search -->
          <div class="relative w-full">
            <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher un client..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <!-- Controls Row -->
          <div class="flex flex-col sm:flex-row gap-3">
            <!-- Status Filter -->
            <div class="relative flex-1 sm:flex-initial">
              <select
                v-model="selectedStatus"
                class="appearance-none w-full sm:w-auto px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
              >
                <option>Tous les statuts</option>
                <option>Payé</option>
                <option>En cours</option>
                <option>En retard</option>
              </select>
              <ChevronDown :size="18" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>

            <!-- Export Dropdown -->
            <div class="relative flex-1 sm:flex-initial">
              <button
                @click="showExportMenu = !showExportMenu"
                class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors"
              >
                <Download :size="16" />
                <span class="hidden sm:inline">Exporter</span>
                <span class="sm:hidden">Export</span>
                <ChevronDown :size="14" />
              </button>

              <!-- Export Menu -->
              <div
                v-show="showExportMenu"
                class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10"
                @click.stop
              >
                <button
                  @click="exportPaymentsExcel"
                  class="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 text-gray-700"
                >
                  <FileSpreadsheet :size="16" />
                  Paiements Excel
                </button>
                <button
                  @click="exportPaymentsPDF"
                  class="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 text-gray-700"
                >
                  <FileText :size="16" />
                  Paiements PDF
                </button>
                <button
                  @click="exportTransactionHistoryFull"
                  class="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 text-gray-700"
                >
                  <FileSpreadsheet :size="16" />
                  Historique complet
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="p-6">
      <div class="animate-pulse">
        <div class="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div class="space-y-3">
          <div v-for="i in 5" :key="i" class="h-16 bg-gray-200 rounded"></div>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div v-else>
      <!-- Mobile Cards View -->
      <div v-if="filteredPayments.length > 0" class="md:hidden">
        <div class="divide-y divide-gray-200">
          <div
            v-for="payment in filteredPayments"
            :key="payment.id"
            class="p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold', payment.avatarColor]">
                  {{ payment.avatar }}
                </div>
                <div>
                  <h4 class="font-medium text-gray-900">{{ payment.client }}</h4>
                  <p class="text-sm text-gray-600">{{ payment.date }}</p>
                </div>
              </div>
              <span :class="['inline-flex px-2 py-1 rounded-full text-xs font-semibold', payment.statusColor]">
                {{ payment.status }}
              </span>
            </div>

            <div class="flex justify-between items-center mb-3">
              <div>
                <p class="text-sm text-gray-600">Montant</p>
                <p class="font-semibold text-gray-900">{{ payment.amount }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600">Tranche</p>
                <p class="font-medium text-gray-700">{{ payment.tranche }}</p>
              </div>
            </div>

            <div class="flex gap-2">
              <button
                v-if="payment.rawStatus === 'pending'"
                @click="markAsCompleted(payment.id)"
                class="flex-1 flex items-center justify-center gap-2 p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
              >
                <Check :size="16" />
                Marquer payé
              </button>
              <button
                v-else
                class="flex-1 flex items-center justify-center gap-2 p-2 text-gray-400 cursor-not-allowed rounded-lg"
                disabled
              >
                <Check :size="16" />
                Déjà payé
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Desktop Table View -->
      <div v-if="filteredPayments.length > 0" class="hidden md:block overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Client</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Montant</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tranche</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Statut</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="payment in filteredPayments" :key="payment.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-4">
                <div class="flex items-center gap-3">
                  <div :class="['w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold', payment.avatarColor]">
                    {{ payment.avatar }}
                  </div>
                  <span class="font-medium text-gray-900">{{ payment.client }}</span>
                </div>
              </td>
              <td class="px-6 py-4 text-gray-900 font-medium">{{ payment.amount }}</td>
              <td class="px-6 py-4 text-gray-600">{{ payment.tranche }}</td>
              <td class="px-6 py-4 text-gray-600">{{ payment.date }}</td>
              <td class="px-6 py-4">
                <span :class="['inline-flex px-3 py-1 rounded-full text-xs font-semibold', payment.statusColor]">
                  {{ payment.status }}
                </span>
              </td>
              <td class="px-6 py-4">
                <div class="flex items-center gap-2">
                  <button
                    v-if="payment.rawStatus === 'pending'"
                    @click="markAsCompleted(payment.id)"
                    class="p-2 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                    title="Marquer comme payé"
                  >
                    <Check :size="18" />
                  </button>
                  <button
                    v-else
                    class="p-2 text-gray-400 cursor-not-allowed rounded-lg"
                    disabled
                    title="Déjà payé"
                  >
                    <Check :size="18" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div v-else class="px-6 py-12 text-center">
        <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Search :size="32" class="text-gray-400" />
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun paiement trouvé</h3>
        <p class="text-gray-600">
          {{ searchQuery || selectedStatus !== 'Tous les statuts' ? 'Essayez de modifier vos filtres' : 'Aucun paiement enregistré' }}
        </p>
      </div>
    </div> <!-- End content container -->
  </div> <!-- End main container -->
</template>