<script setup>
import { ref } from 'vue';
import { Search, ChevronDown, Eye, Pencil, Trash2 } from 'lucide-vue-next';

const searchQuery = ref('');
const selectedStatus = ref('Tous les statuts');

const payments = [
  {
    id: 1,
    client: 'Amadou Diallo',
    avatar: 'A',
    avatarColor: 'bg-teal-500',
    amount: '50,000 FCFA',
    tranche: '1/3',
    date: '15 Jan 2024',
    status: 'Payé',
    statusColor: 'bg-green-100 text-green-700'
  },
  {
    id: 2,
    client: 'Fatou Sall',
    avatar: 'F',
    avatarColor: 'bg-teal-500',
    amount: '75,000 FCFA',
    tranche: '2/4',
    date: '18 Jan 2024',
    status: 'En cours',
    statusColor: 'bg-orange-100 text-orange-700'
  }
];
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm">
    <!-- Header -->
    <div class="p-6 border-b border-gray-200">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 class="text-xl font-bold text-gray-900">Liste des paiements</h2>
        
        <div class="flex flex-col sm:flex-row gap-3">
          <!-- Search -->
          <div class="relative flex-1 sm:w-64">
            <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher un client..."
              class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          <!-- Status Filter -->
          <div class="relative">
            <select
              v-model="selectedStatus"
              class="appearance-none px-4 py-2 pr-10 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
            >
              <option>Tous les statuts</option>
              <option>Payé</option>
              <option>En cours</option>
              <option>En retard</option>
            </select>
            <ChevronDown :size="18" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="overflow-x-auto">
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
          <tr v-for="payment in payments" :key="payment.id" class="hover:bg-gray-50 transition-colors">
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
                <button class="p-2 text-gray-600 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors">
                  <Eye :size="18" />
                </button>
                <button class="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                  <Pencil :size="18" />
                </button>
                <button class="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 :size="18" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>