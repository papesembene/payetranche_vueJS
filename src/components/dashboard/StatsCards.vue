<script setup>
import { DollarSign, Check, AlertTriangle, Users } from 'lucide-vue-next';

const stats = [
  {
    title: 'Total à recevoir',
    value: '2.5M FCFA',
    change: '+12%',
    isPositive: true,
    icon: DollarSign,
    bgColor: 'bg-teal-100',
    iconColor: 'text-teal-600'
  },
  {
    title: 'Paiements reçus',
    value: '1.8M FCFA',
    change: '+8%',
    isPositive: true,
    icon: Check,
    bgColor: 'bg-green-100',
    iconColor: 'text-green-600'
  },
  {
    title: 'En retard',
    value: '350K FCFA',
    change: '-5%',
    isPositive: false,
    icon: AlertTriangle,
    bgColor: 'bg-red-100',
    iconColor: 'text-red-600'
  },
  {
    title: 'Clients actifs',
    value: '127',
    change: '+15%',
    isPositive: true,
    icon: Users,
    bgColor: 'bg-yellow-100',
    iconColor: 'text-yellow-600'
  }
];
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div
      v-for="(stat, index) in stats"
      :key="index"
      class="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
    >
      <div class="flex items-start justify-between mb-4">
        <div :class="['w-14 h-14 rounded-xl flex items-center justify-center', stat.bgColor]">
          <component :is="stat.icon" :size="24" :class="stat.iconColor" />
        </div>
        <span
          :class="[
            'text-sm font-semibold',
            stat.isPositive ? 'text-green-600' : 'text-red-600'
          ]"
        >
          {{ stat.change }}
        </span>
      </div>
      <h3 class="text-2xl font-bold text-gray-900 mb-1">{{ stat.value }}</h3>
      <p class="text-sm text-gray-600">{{ stat.title }}</p>
    </div>
  </div>
</template>