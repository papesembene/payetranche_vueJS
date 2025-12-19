<script setup>
import { ref } from 'vue';
import { Search, ChevronDown, Plus } from 'lucide-vue-next';
import ClientCard from './ClientCard.vue';

const searchQuery = ref('');
const selectedStatus = ref('Tous les statuts');

const clients = [
  {
    id: 1,
    name: 'Amadou Diallo',
    phone: '+221 77 123 45 67',
    email: 'amadou.diallo@email.com',
    total: '500 000 FCFA',
    paid: '150 000 FCFA',
    remaining: '350 000 FCFA',
    progress: 30,
    status: 'En cours',
    statusColor: 'bg-blue-100 text-blue-700',
    historyCount: 2
  },
  {
    id: 2,
    name: 'Fatou Sall',
    phone: '+221 76 234 56 78',
    email: 'fatou.sall@email.com',
    total: '750 000 FCFA',
    paid: '600 000 FCFA',
    remaining: '150 000 FCFA',
    progress: 80,
    status: 'En cours',
    statusColor: 'bg-blue-100 text-blue-700',
    historyCount: 3
  },
  {
    id: 3,
    name: 'Moussa Ndiaye',
    phone: '+221 78 345 67 89',
    email: 'moussa.ndiaye@email.com',
    total: '300 000 FCFA',
    paid: '300 000 FCFA',
    remaining: '0 FCFA',
    progress: 100,
    status: 'Payé',
    statusColor: 'bg-green-100 text-green-700',
    historyCount: 1
  }
];
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
      <!-- Search -->
      <div class="relative flex-1 md:max-w-md">
        <Search :size="18" class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Rechercher un client..."
          class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      <div class="flex gap-3">
        <!-- Status Filter -->
        <div class="relative">
          <select
            v-model="selectedStatus"
            class="appearance-none px-4 py-3 pr-10 border border-gray-300 rounded-xl bg-gray-100 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent cursor-pointer"
          >
            <option>Tous les statuts</option>
            <option>Payé</option>
            <option>En cours</option>
            <option>En retard</option>
          </select>
          <ChevronDown :size="18" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
        </div>

        <!-- Add Client Button -->
        <button class="flex items-center gap-2 px-5 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors shadow-md">
          <Plus :size="20" />
          Nouveau client
        </button>
      </div>
    </div>

    <!-- Clients Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <ClientCard
        v-for="client in clients"
        :key="client.id"
        :client="client"
      />
    </div>
  </div>
</template>