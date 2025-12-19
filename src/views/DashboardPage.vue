<script setup>
import { ref } from 'vue';
import DashboardHeader from '../components/dashboard/DashboardHeader.vue';
import StatsCards from '../components/dashboard/StatsCards.vue';
import PaymentsView from '../components/dashboard/PaymentsView.vue';
import ClientsView from '../components/dashboard/ClientsView.vue';

const activeTab = ref('payments');

const setActiveTab = (tab) => {
  activeTab.value = tab;
};
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardHeader />
    
    <main class="max-w-7xl mx-auto px-6 lg:px-8 py-8">
      <!-- Page Title -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Tableau de bord</h1>
        <p class="text-gray-600">Gérez vos paiements et suivez vos clients</p>
      </div>

      <!-- Stats Cards -->
      <StatsCards />

      <!-- Tabs -->
      <div class="flex gap-4 mb-6">
        <button
          @click="setActiveTab('payments')"
          :class="[
            'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all',
            activeTab === 'payments'
              ? 'bg-teal-500 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          ]"
        >
          <DollarSign :size="20" />
          Paiements
        </button>
        <button
          @click="setActiveTab('clients')"
          :class="[
            'flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all',
            activeTab === 'clients'
              ? 'bg-teal-500 text-white shadow-md'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          ]"
        >
          <Users :size="20" />
          Clients
        </button>
      </div>

      <!-- Content -->
      <PaymentsView v-if="activeTab === 'payments'" />
      <ClientsView v-else />
    </main>
  </div>
</template>

<script>
import { DollarSign, Users } from 'lucide-vue-next';
export default {
  components: {
    DollarSign,
    Users
  }
};
</script>