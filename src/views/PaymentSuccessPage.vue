<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full">
      <!-- Success Card -->
      <div class="bg-white rounded-lg shadow-lg p-8 text-center">
        <!-- Success Icon -->
        <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle :size="32" class="text-green-600" />
        </div>

        <!-- Title -->
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Paiement réussi</h1>
        <p class="text-gray-600 mb-6">
          Le paiement a été reçu. Gardez la référence comme preuve.
        </p>

        <!-- Payment Details -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Référence :</span>
              <span class="text-sm font-medium">{{ paymentDetails.ref || paymentDetails.token || 'N/A' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Montant :</span>
              <span class="text-sm font-medium">{{ paymentDetails.amount || '5 000' }} FCFA</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Méthode :</span>
              <span class="text-sm font-medium">Mobile Money</span>
            </div>
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Date :</span>
              <span class="text-sm font-medium">{{ formatDate(new Date()) }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="space-y-3">
          <button
            @click="goBack"
            class="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            {{ paymentDetails.portal ? 'Retour au suivi' : 'Retour au tableau de bord' }}
          </button>

          <button
            v-if="!paymentDetails.portal"
            @click="goToSettings"
            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Voir mes paramètres
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { CheckCircle } from 'lucide-vue-next';

const router = useRouter();

const paymentDetails = ref({
  token: '',
  status: '',
  ref: '',
  amount: '',
  portal: ''
});

const formatDate = (date) => {
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const goBack = () => {
  if (paymentDetails.value.portal) {
    router.push(`/suivi/${paymentDetails.value.portal}`);
    return;
  }
  router.push('/dashboard');
};

const goToSettings = () => {
  router.push('/settings');
};

onMounted(async () => {
  // Récupérer les paramètres de l'URL
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token');
  const status = urlParams.get('status');
  const ref = urlParams.get('ref');
  const portal = urlParams.get('portal');

  paymentDetails.value = {
    token: token || 'N/A',
    status: status || 'completed',
    ref: ref || '',
    amount: urlParams.get('amount') || 'Confirmé',
    portal: portal || ''
  };
});
</script>
