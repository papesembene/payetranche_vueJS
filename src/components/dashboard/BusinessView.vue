<script setup>
import { computed, onMounted, ref } from 'vue';
import { Loader2, PackagePlus, ReceiptText, ShoppingBag, Trash2 } from 'lucide-vue-next';
import { businessService } from '../../services/business.service.js';
import { getUserFriendlyError } from '../../utils/userFriendlyError.js';

const emit = defineEmits(['updated']);

const loading = ref(false);
const saving = ref(false);
const actionLoadingId = ref('');
const errors = ref({});
const summary = ref(null);
const entries = ref([]);
const suppliers = ref([]);
const activeType = ref('SUPPLIER_PURCHASE');

const form = ref({
  title: '',
  amount: '',
  paidAmount: '',
  supplierId: '',
  supplierName: '',
  supplierPhone: '',
  note: '',
  occurredAt: new Date().toISOString().split('T')[0],
});

const entryTypes = [
  { id: 'SUPPLIER_PURCHASE', label: 'Achat fournisseur', icon: PackagePlus },
  { id: 'EXPENSE', label: 'Charge boutique', icon: ReceiptText },
];

const activeTypeLabel = computed(() => entryTypes.find((type) => type.id === activeType.value)?.label || '');

const stats = computed(() => [
  { label: 'Encaissé clients', value: summary.value?.revenue || 0, tone: 'text-green-700 bg-green-50' },
  { label: 'Achats fournisseurs', value: summary.value?.supplierPurchases || 0, tone: 'text-blue-700 bg-blue-50' },
  { label: 'Charges boutique', value: summary.value?.expenses || 0, tone: 'text-red-700 bg-red-50' },
  { label: 'Résultat estimé', value: summary.value?.estimatedProfit || 0, tone: (summary.value?.estimatedProfit || 0) >= 0 ? 'text-teal-700 bg-teal-50' : 'text-red-700 bg-red-50' },
]);

const formatAmount = (amount) => `${new Intl.NumberFormat('fr-FR').format(Number(amount || 0))} FCFA`;

const formatDate = (value) => {
  if (!value) return '';
  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
  });
};

const resetForm = () => {
  form.value = {
    title: '',
    amount: '',
    paidAmount: '',
    supplierId: '',
    supplierName: '',
    supplierPhone: '',
    note: '',
    occurredAt: new Date().toISOString().split('T')[0],
  };
};

const selectType = (type) => {
  activeType.value = type;
  errors.value = {};
  resetForm();
};

const loadData = async () => {
  try {
    loading.value = true;
    const [summaryData, entriesData, suppliersData] = await Promise.all([
      businessService.getSummary(),
      businessService.getEntries(),
      businessService.getSuppliers(),
    ]);
    summary.value = summaryData;
    entries.value = entriesData;
    suppliers.value = suppliersData;
  } catch (error) {
    errors.value.general = getUserFriendlyError(error, 'load');
  } finally {
    loading.value = false;
  }
};

const saveEntry = async () => {
  if (saving.value) return;

  errors.value = {};
  const amount = Number(form.value.amount || 0);
  const paidAmount = Number(form.value.paidAmount || 0);

  if (!form.value.title.trim()) errors.value.title = 'Libellé requis';
  if (!amount || amount <= 0) errors.value.amount = 'Montant requis';
  if (activeType.value === 'SUPPLIER_PURCHASE') {
    if (!form.value.supplierId && !form.value.supplierName.trim()) {
      errors.value.supplier = 'Fournisseur requis';
    }
    if (paidAmount > amount) errors.value.paidAmount = 'Le payé dépasse le montant';
  }

  if (Object.keys(errors.value).length > 0) return;

  try {
    saving.value = true;
    await businessService.createEntry({
      ...form.value,
      type: activeType.value,
      amount,
      paidAmount: activeType.value === 'SUPPLIER_PURCHASE' ? paidAmount : amount,
    });
    resetForm();
    await loadData();
    emit('updated');
  } catch (error) {
    errors.value.general = getUserFriendlyError(error, 'save');
  } finally {
    saving.value = false;
  }
};

const deleteEntry = async (entry) => {
  if (!window.confirm('Supprimer cette opération ?')) return;

  try {
    actionLoadingId.value = entry.id;
    await businessService.deleteEntry(entry.id);
    await loadData();
    emit('updated');
  } catch (error) {
    errors.value.general = getUserFriendlyError(error, 'save');
  } finally {
    actionLoadingId.value = '';
  }
};

onMounted(loadData);
</script>

<template>
  <div class="space-y-4">
    <div v-if="errors.general" class="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
      {{ errors.general }}
    </div>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <div v-for="stat in stats" :key="stat.label" class="rounded-lg border border-gray-200 bg-white p-4">
        <p class="text-sm font-semibold text-gray-500">{{ stat.label }}</p>
        <p :class="['mt-2 rounded-lg px-3 py-2 text-lg font-black', stat.tone]">{{ formatAmount(stat.value) }}</p>
      </div>
    </div>

    <section class="rounded-lg border border-gray-200 bg-white p-4">
      <div class="mb-4 flex items-center gap-2">
        <ShoppingBag :size="20" class="text-teal-600" />
        <h2 class="text-lg font-black text-gray-950">Ma boutique</h2>
      </div>

      <div class="grid grid-cols-3 gap-2">
        <button
          v-for="type in entryTypes"
          :key="type.id"
          type="button"
          @click="selectType(type.id)"
          :class="[
            'flex min-h-[76px] flex-col items-center justify-center gap-2 rounded-lg border px-2 text-sm font-black',
            activeType === type.id ? 'border-teal-400 bg-teal-50 text-teal-800' : 'border-gray-200 text-gray-700'
          ]"
        >
          <component :is="type.icon" :size="20" />
          <span class="text-center leading-tight">{{ type.label }}</span>
        </button>
      </div>

      <form class="mt-4 space-y-3" @submit.prevent="saveEntry">
        <div>
          <label class="mb-1 block text-sm font-semibold text-gray-700">
            {{ activeType === 'SUPPLIER_PURCHASE' ? 'Marchandise achetée' : 'Charge' }}
          </label>
          <input
            v-model.trim="form.title"
            type="text"
            :placeholder="activeType === 'SUPPLIER_PURCHASE' ? 'Ex: cartons de marchandise' : 'Ex: transport, loyer, manutention'"
            class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <p v-if="errors.title" class="mt-1 text-xs text-red-600">{{ errors.title }}</p>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="mb-1 block text-sm font-semibold text-gray-700">Montant</label>
            <input v-model="form.amount" type="number" min="1" placeholder="Ex: 10000" class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
            <p v-if="errors.amount" class="mt-1 text-xs text-red-600">{{ errors.amount }}</p>
          </div>
          <div>
            <label class="mb-1 block text-sm font-semibold text-gray-700">Date</label>
            <input v-model="form.occurredAt" type="date" class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
          </div>
        </div>

        <div v-if="activeType === 'SUPPLIER_PURCHASE'" class="space-y-3 rounded-lg border border-blue-100 bg-blue-50 p-3">
          <div>
            <label class="mb-1 block text-sm font-semibold text-blue-900">Fournisseur</label>
            <select v-model="form.supplierId" class="w-full rounded-lg border border-blue-200 bg-white px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Nouveau fournisseur</option>
              <option v-for="supplier in suppliers" :key="supplier.id" :value="supplier.id">
                {{ supplier.name }}{{ supplier.phone ? ` - ${supplier.phone}` : '' }}
              </option>
            </select>
          </div>
          <div v-if="!form.supplierId" class="grid gap-3 sm:grid-cols-2">
            <input v-model.trim="form.supplierName" type="text" placeholder="Nom fournisseur" class="w-full rounded-lg border border-blue-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <input v-model.trim="form.supplierPhone" type="tel" placeholder="Téléphone" class="w-full rounded-lg border border-blue-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <p v-if="errors.supplier" class="text-xs text-red-600">{{ errors.supplier }}</p>
          <div>
            <label class="mb-1 block text-sm font-semibold text-blue-900">Montant déjà payé</label>
            <input v-model="form.paidAmount" type="number" min="0" placeholder="0 si acheté à crédit" class="w-full rounded-lg border border-blue-200 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p v-if="errors.paidAmount" class="mt-1 text-xs text-red-600">{{ errors.paidAmount }}</p>
          </div>
        </div>

        <div>
          <label class="mb-1 block text-sm font-semibold text-gray-700">Note</label>
          <input v-model.trim="form.note" type="text" placeholder="Optionnel" class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500" />
        </div>

        <button
          type="submit"
          :disabled="saving"
          class="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 font-black text-white disabled:opacity-60"
        >
          <Loader2 v-if="saving" :size="18" class="animate-spin" />
          {{ saving ? 'Enregistrement...' : activeTypeLabel }}
        </button>
      </form>
    </section>

    <section class="rounded-lg border border-gray-200 bg-white">
      <div class="border-b border-gray-200 px-4 py-3">
        <h3 class="font-black text-gray-950">Historique boutique</h3>
      </div>

      <div v-if="loading" class="p-6 text-center text-sm font-semibold text-gray-500">Chargement...</div>
      <div v-else-if="entries.length === 0" class="p-6 text-center text-sm font-semibold text-gray-500">Aucune opération boutique.</div>

      <div v-else class="divide-y divide-gray-100">
        <article v-for="entry in entries" :key="entry.id" class="flex items-start gap-3 p-4">
          <div class="min-w-0 flex-1">
            <div class="flex flex-wrap items-center gap-2">
              <p class="font-black text-gray-950">{{ entry.title }}</p>
              <span class="rounded-full bg-gray-100 px-2 py-1 text-xs font-bold text-gray-600">{{ entry.displayType }}</span>
              <span v-if="entry.type === 'SUPPLIER_PURCHASE'" class="rounded-full bg-blue-50 px-2 py-1 text-xs font-bold text-blue-700">{{ entry.displayStatus }}</span>
            </div>
            <p class="mt-1 text-sm font-semibold text-gray-500">
              {{ formatDate(entry.occurredAt) }}
              <span v-if="entry.supplier"> · {{ entry.supplier.name }}</span>
            </p>
            <p v-if="entry.remainingAmount > 0" class="mt-1 text-sm font-bold text-amber-700">
              Reste fournisseur: {{ formatAmount(entry.remainingAmount) }}
            </p>
          </div>
          <div class="shrink-0 text-right">
            <p class="font-black text-gray-950">{{ formatAmount(entry.amount) }}</p>
            <button
              type="button"
              :disabled="Boolean(actionLoadingId)"
              @click="deleteEntry(entry)"
              class="mt-2 inline-flex items-center justify-center rounded-lg border border-red-100 p-2 text-red-600 disabled:opacity-60"
              aria-label="Supprimer"
            >
              <Loader2 v-if="actionLoadingId === entry.id" :size="16" class="animate-spin" />
              <Trash2 v-else :size="16" />
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>
