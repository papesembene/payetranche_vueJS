<script setup>
import { Phone, Mail, Plus, History } from 'lucide-vue-next';

defineProps({
  client: {
    type: Object,
    required: true
  }
});
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
        <Mail :size="16" />
        <span>{{ client.email }}</span>
      </div>
    </div>

    <!-- Payment Details -->
    <div class="space-y-3 mb-4 pt-4 border-t border-gray-200">
      <div class="flex justify-between text-sm">
        <span class="text-gray-600">Total</span>
        <span class="font-semibold text-gray-900">{{ client.total }}</span>
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
        v-if="client.progress < 100"
        class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors"
      >
        <Plus :size="18" />
        Ajouter un paiement
      </button>
      <button class="w-full flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-xl transition-colors">
        <History :size="18" />
        Voir l'historique ({{ client.historyCount }})
      </button>
    </div>
  </div>
</template>