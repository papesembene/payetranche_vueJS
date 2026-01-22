<template>
  <!-- Loading State -->
  <div v-if="!currentPlan.name" class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
    <div class="animate-pulse">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gray-200 rounded-lg"></div>
          <div>
            <div class="h-4 bg-gray-200 rounded w-24 mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
        <div class="h-6 bg-gray-200 rounded w-16"></div>
      </div>
      <div class="mt-4 grid grid-cols-3 gap-4">
        <div v-for="i in 3" :key="i" class="text-center">
          <div class="h-6 bg-gray-200 rounded w-8 mx-auto mb-1"></div>
          <div class="h-3 bg-gray-200 rounded w-12 mx-auto mb-2"></div>
          <div class="w-full bg-gray-200 rounded-full h-1"></div>
        </div>
      </div>
    </div>
  </div>

  <!-- Loaded State -->
  <div v-else class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
          <Crown :size="20" class="text-teal-600" />
        </div>
        <div>
          <h3 class="font-semibold text-gray-900">{{ currentPlan.name }}</h3>
          <p class="text-sm text-gray-600">
            {{ currentPlan.price === 0 ? 'Gratuit' : `${currentPlan.price} ${currentPlan.currency}/${currentPlan.billing}` }}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <!-- Status Badge -->
        <span
          :class="[
            'px-2 py-1 text-xs font-medium rounded-full',
            subscriptionStatus.status === 'active' ? 'bg-green-100 text-green-800' :
            subscriptionStatus.status === 'trial' ? 'bg-blue-100 text-blue-800' :
            subscriptionStatus.status === 'expired' ? 'bg-red-100 text-red-800' :
            'bg-gray-100 text-gray-800'
          ]"
        >
          {{ getStatusLabel(subscriptionStatus.status) }}
        </span>

        <!-- Upgrade Button (if not enterprise) -->
        <button
          v-if="currentPlan.id !== 'enterprise'"
          @click="$emit('upgrade')"
          class="px-3 py-1 text-sm bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-colors"
        >
          Mettre à niveau
        </button>
      </div>
    </div>

    <!-- Usage Stats -->
    <div class="mt-4 grid grid-cols-3 gap-4">
      <div class="text-center">
        <div class="text-lg font-semibold text-gray-900">{{ user.usage?.clients || 0 }}</div>
        <div class="text-xs text-gray-600">
          / {{ currentPlan.limits?.maxClients === -1 ? '∞' : (currentPlan.limits?.maxClients || 0) }} clients
        </div>
        <div class="w-full bg-gray-200 rounded-full h-1 mt-1">
          <div
            :class="[
              'h-1 rounded-full',
              getUsagePercentage('clients') > 90 ? 'bg-red-500' :
              getUsagePercentage('clients') > 70 ? 'bg-yellow-500' : 'bg-green-500'
            ]"
            :style="{ width: Math.min(getUsagePercentage('clients'), 100) + '%' }"
          ></div>
        </div>
      </div>

      <div class="text-center">
        <div class="text-lg font-semibold text-gray-900">{{ user.usage?.payments || 0 }}</div>
        <div class="text-xs text-gray-600">
          / {{ currentPlan.limits?.maxPayments === -1 ? '∞' : (currentPlan.limits?.maxPayments || 0) }} paiements
        </div>
        <div class="w-full bg-gray-200 rounded-full h-1 mt-1">
          <div
            :class="[
              'h-1 rounded-full',
              getUsagePercentage('payments') > 90 ? 'bg-red-500' :
              getUsagePercentage('payments') > 70 ? 'bg-yellow-500' : 'bg-green-500'
            ]"
            :style="{ width: Math.min(getUsagePercentage('payments'), 100) + '%' }"
          ></div>
        </div>
      </div>

      <div class="text-center">
        <div class="text-lg font-semibold text-gray-900">{{ formatAmount(user.usage?.totalAmount || 0) }}</div>
        <div class="text-xs text-gray-600">
          / {{ currentPlan.limits?.maxPaymentAmount === -1 ? '∞' : formatAmount(currentPlan.limits?.maxPaymentAmount || 0) }}
        </div>
        <div class="w-full bg-gray-200 rounded-full h-1 mt-1">
          <div
            :class="[
              'h-1 rounded-full',
              getUsagePercentage('amount') > 90 ? 'bg-red-500' :
              getUsagePercentage('amount') > 70 ? 'bg-yellow-500' : 'bg-green-500'
            ]"
            :style="{ width: Math.min(getUsagePercentage('amount'), 100) + '%' }"
          ></div>
        </div>
      </div>
    </div>

    <!-- Expiry Warning -->
    <div v-if="daysUntilExpiry <= 7 && daysUntilExpiry > 0" class="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
      <p class="text-sm text-yellow-800">
        <AlertTriangle :size="16" class="inline mr-1" />
        Votre abonnement expire dans {{ daysUntilExpiry }} jour{{ daysUntilExpiry > 1 ? 's' : '' }}
      </p>
    </div>

    <!-- Expired Notice -->
    <div v-if="subscriptionStatus.status === 'expired'" class="mt-3 p-2 bg-red-50 border border-red-200 rounded-md">
      <p class="text-sm text-red-800">
        <AlertTriangle :size="16" class="inline mr-1" />
        Votre abonnement a expiré. Mettez à niveau pour continuer à utiliser toutes les fonctionnalités.
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useUserStore } from '../stores/user.js';
import { Crown, AlertTriangle } from 'lucide-vue-next';

const userStore = useUserStore();
const user = computed(() => userStore.user);
const currentPlan = computed(() => userStore.currentPlan);
const subscriptionStatus = computed(() => userStore.subscriptionStatus);
const daysUntilExpiry = computed(() => userStore.daysUntilExpiry);

const getStatusLabel = (status) => {
  const labels = {
    active: 'Actif',
    trial: 'Essai',
    expired: 'Expiré',
    cancelled: 'Annulé',
    past_due: 'En retard'
  };
  return labels[status] || status;
};

const getUsagePercentage = (type) => {
  const limits = currentPlan.value.limits;
  const usage = user.value.usage;

  if (!limits) return 0;

  if (type === 'clients') {
    return limits.maxClients === -1 ? 0 : ((usage?.clients || 0) / limits.maxClients) * 100;
  } else if (type === 'payments') {
    return limits.maxPayments === -1 ? 0 : ((usage?.payments || 0) / limits.maxPayments) * 100;
  } else if (type === 'amount') {
    return limits.maxPaymentAmount === -1 ? 0 : ((usage?.totalAmount || 0) / limits.maxPaymentAmount) * 100;
  }
  return 0;
};

const formatAmount = (amount) => {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `${(amount / 1000).toFixed(0)}K`;
  }
  return amount.toString();
};

// Émettre l'événement upgrade
defineEmits(['upgrade']);
</script>