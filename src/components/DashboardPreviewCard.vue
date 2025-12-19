<script setup>
import { TrendingUp, AlertTriangle } from 'lucide-vue-next';
import { dashboardStats, recentPayments } from '../data/mockData';

const getStatusColor = (status) => {
  switch (status) {
    case 'payé':
      return 'text-emerald-600';
    case 'en cours':
      return 'text-orange-500';
    case 'retard':
      return 'text-red-500';
    default:
      return 'text-gray-600';
  }
};

const getAvatarColor = (avatar) => {
  return 'bg-teal-500';
};
</script>

<template>
  <div class="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-lg transform hover:scale-105 transition-transform duration-300">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <h3 class="text-2xl font-bold text-gray-900">Tableau de bord</h3>
      <div class="flex gap-2">
        <div class="w-3.5 h-3.5 rounded-full bg-red-400"></div>
        <div class="w-3.5 h-3.5 rounded-full bg-yellow-400"></div>
        <div class="w-3.5 h-3.5 rounded-full bg-green-400"></div>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-2 gap-5 mb-8">
      <!-- Total à recevoir -->
      <div class="bg-teal-500 rounded-2xl p-6 text-white shadow-lg">
        <p class="text-sm opacity-90 mb-2 font-medium">Total à recevoir</p>
        <p class="text-3xl font-bold mb-3">2.5M FCFA</p>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <TrendingUp :size="16" :stroke-width="2.5" />
          <span>+12% ce mois</span>
        </div>
      </div>

      <!-- En retard -->
      <div class="bg-red-400 rounded-2xl p-6 text-white shadow-lg">
        <p class="text-sm opacity-90 mb-2 font-medium">En retard</p>
        <p class="text-3xl font-bold mb-3">350K FCFA</p>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <AlertTriangle :size="16" :stroke-width="2.5" />
          <span>5 clients</span>
        </div>
      </div>
    </div>

    <!-- Recent Payments -->
    <div>
      <h4 class="text-base font-semibold text-gray-600 mb-5">Paiements récents</h4>
      <div class="space-y-4">
        <div 
          v-for="payment in recentPayments" 
          :key="payment.id"
          class="flex items-center justify-between py-2"
        >
          <div class="flex items-center gap-4">
            <div :class="[getAvatarColor(payment.avatar), 'w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md']">
              {{ payment.avatar }}
            </div>
            <span class="text-gray-900 font-medium text-base">{{ payment.clientName }}</span>
          </div>
          <div class="text-right">
            <p class="text-gray-900 font-bold text-lg">{{ payment.amount }}K</p>
            <p :class="[getStatusColor(payment.status), 'text-sm font-semibold']">
              {{ payment.status }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>