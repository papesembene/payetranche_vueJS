<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Search, ChevronDown, Plus, Users, Download, FileText, FileSpreadsheet } from 'lucide-vue-next';
import ClientCard from './ClientCard.vue';
import ClientForm from './ClientForm.vue';
import PaymentForm from './PaymentForm.vue';
import { clientService } from '../../services/client.service.js';
import { transactionService } from '../../services/transaction.service.js';
import { useUserStore } from '../../stores/user.js';
import { exportClientsToExcel, generateReportPDF } from '../../utils/export.js';

const props = defineProps({
  refresh: {
    type: Number,
    default: 0
  }
});

const userStore = useUserStore();

// Watch for refresh prop changes
watch(() => props.refresh, () => {
  loadData();
});

watch(() => searchQuery.value, () => {
  currentPage.value = 1;
});

watch(() => selectedStatus.value, () => {
  currentPage.value = 1;
});

const searchQuery = ref('');
const selectedStatus = ref('Tous les statuts');
const clients = ref([]);
const transactions = ref([]);
const loading = ref(false);
const showForm = ref(false);
const showExportMenu = ref(false);
const showPaymentForm = ref(false);
const selectedClientForPayment = ref(null);
const currentPage = ref(1);
const itemsPerPage = ref(12); // 3x4 grid

const canAddClient = computed(() => userStore.canAddClient);

const loadData = async () => {
  if (loading.value) return; // Prevent multiple simultaneous calls
  try {
    loading.value = true;
    const [clientsData, transactionsData] = await Promise.all([
      clientService.getClients(),
      transactionService.getTransactions()
    ]);

    clients.value = clientsData;
    transactions.value = transactionsData;
  } catch (error) {
    console.error('Erreur chargement clients:', error);
    clients.value = [];
    transactions.value = [];
  } finally {
    loading.value = false;
  }
};

// Calculer les données pour chaque client
const clientsWithStats = computed(() => {
  return clients.value.map(client => {
    const clientTransactions = transactions.value.filter(t => t.clientId === client.id);
    const totalPaid = clientTransactions
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalDebt = client.totalDebt || 0;
    const remaining = totalDebt - totalPaid;
    const progress = totalDebt > 0 ? Math.round((totalPaid / totalDebt) * 100) : 0;

    // Déterminer le statut
    let status = 'En cours';
    let statusColor = 'bg-blue-100 text-blue-700';

    if (remaining <= 0) {
      status = 'Payé';
      statusColor = 'bg-green-100 text-green-700';
    } else if (clientTransactions.some(t => t.status === 'pending' && new Date(t.dueDate) < new Date())) {
      status = 'En retard';
      statusColor = 'bg-red-100 text-red-700';
    }

    return {
      id: client.id,
      name: client.name,
      phone: client.phone,
      address: client.address,
      total: formatAmount(totalDebt),
      paid: formatAmount(totalPaid),
      remaining: formatAmount(remaining),
      progress,
      status,
      statusColor,
      historyCount: clientTransactions.length
    };
  });
});

// Filtrage des clients
const filteredClients = computed(() => {
  let filtered = clientsWithStats.value;

  // Filtre par recherche
  if (searchQuery.value) {
    filtered = filtered.filter(client =>
      client.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      client.address.toLowerCase().includes(searchQuery.value.toLowerCase())
    );
  }

  // Filtre par statut
  if (selectedStatus.value !== 'Tous les statuts') {
    filtered = filtered.filter(client => client.status === selectedStatus.value);
  }

  return filtered;
});

const formatAmount = (amount) => {
  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
};

const openAddClientForm = () => {
  showForm.value = true;
};

const closeForm = () => {
  showForm.value = false;
};

const onClientSaved = () => {
  loadData(); // Reload data after saving
};

const onPaymentAdded = () => {
  loadData(); // Reload data after payment addition
};

const onAddPayment = (client) => {
  selectedClientForPayment.value = client;
  showPaymentForm.value = true;
};

const closePaymentForm = () => {
  showPaymentForm.value = false;
  selectedClientForPayment.value = null;
};

// Export functions
const exportClientsExcel = () => {
  showExportMenu.value = false;
  if (filteredClients.value.length === 0) {
    alert('Aucun client à exporter');
    return;
  }
  exportClientsToExcel(filteredClients.value, `clients-${new Date().toISOString().split('T')[0]}`);
};

const exportClientsPDF = () => {
  showExportMenu.value = false;
  if (filteredClients.value.length === 0) {
    alert('Aucun client à exporter');
    return;
  }
  generateReportPDF('Liste des Clients', filteredClients.value, `clients-${new Date().toISOString().split('T')[0]}`);
};

// Close export menu when clicking outside
const closeExportMenu = () => {
  showExportMenu.value = false;
};

onMounted(() => {
  loadData();
});
</script>

<template>
  <div @click="closeExportMenu">
    <!-- Header -->
    <div class="flex flex-col gap-4 mb-6">
      <!-- Search -->
      <div class="relative w-full">
        <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un client..."
          class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      <!-- Controls Row -->
      <div class="flex flex-col sm:flex-row gap-3">
        <!-- Status Filter -->
        <div class="relative flex-1 sm:flex-initial">
          <select
            v-model="selectedStatus"
            class="appearance-none w-full sm:w-auto px-4 py-3 pr-10 border border-gray-300 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
          >
            <option>Tous les statuts</option>
            <option>Payé</option>
            <option>En cours</option>
            <option>En retard</option>
          </select>
          <ChevronDown :size="18" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
        </div>

        <!-- Export Dropdown -->
        <div class="relative flex-1 sm:flex-initial">
          <button
            @click="showExportMenu = !showExportMenu"
            class="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-medium transition-colors"
          >
            <Download :size="18" />
            <span class="hidden sm:inline">Exporter</span>
            <span class="sm:hidden">Export</span>
            <ChevronDown :size="16" />
          </button>

          <!-- Export Menu -->
          <div
            v-show="showExportMenu"
            class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-10"
            @click.stop
          >
            <button
              @click="exportClientsExcel"
              class="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 text-gray-700"
            >
              <FileSpreadsheet :size="16" />
              Excel (.xlsx)
            </button>
            <button
              @click="exportClientsPDF"
              class="w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 text-gray-700"
            >
              <FileText :size="16" />
              PDF
            </button>
          </div>
        </div>

        <!-- Add Client Button -->
        <button
          @click="openAddClientForm"
          :disabled="!canAddClient"
          :class="[
            'flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 font-semibold rounded-xl transition-colors shadow-md',
            !canAddClient
              ? 'bg-gray-400 cursor-not-allowed text-gray-200'
              : 'bg-teal-500 hover:bg-teal-600 text-white'
          ]"
          :title="!canAddClient ? 'Vous ne pouvez pas ajouter de clients. Vérifiez votre abonnement ou vos limites.' : ''"
        >
          <Plus :size="20" />
          <span class="hidden sm:inline">Nouveau client</span>
          <span class="sm:hidden">Nouveau</span>
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="bg-white rounded-xl p-6 shadow-sm">
        <div class="animate-pulse">
          <div class="flex items-center justify-between mb-4">
            <div class="w-24 h-6 bg-gray-200 rounded"></div>
            <div class="w-16 h-5 bg-gray-200 rounded"></div>
          </div>
          <div class="space-y-2 mb-4">
            <div class="w-32 h-4 bg-gray-200 rounded"></div>
            <div class="w-28 h-4 bg-gray-200 rounded"></div>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-2 mb-3"></div>
          <div class="flex justify-between">
            <div class="w-16 h-4 bg-gray-200 rounded"></div>
            <div class="w-12 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Clients Grid -->
    <div v-else-if="filteredClients.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ClientCard
        v-for="client in filteredClients"
        :key="client.id"
        :client="client"
        @payment-added="onPaymentAdded"
      />
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Users :size="32" class="text-gray-400" />
      </div>
      <h3 class="text-lg font-medium text-gray-900 mb-2">Aucun client trouvé</h3>
      <p class="text-gray-600">
        {{ searchQuery || selectedStatus !== 'Tous les statuts' ? 'Essayez de modifier vos filtres' : 'Commencez par ajouter votre premier client' }}
      </p>
    </div>

    <!-- Client Form Modal -->
    <ClientForm
      :show="showForm"
      @close="closeForm"
      @saved="onClientSaved"
      @addPayment="onAddPayment"
    />

    <!-- Payment Form Modal -->
    <PaymentForm
      :show="showPaymentForm"
      :client="selectedClientForPayment"
      @close="closePaymentForm"
      @saved="onPaymentAdded"
    />
  </div>
</template>