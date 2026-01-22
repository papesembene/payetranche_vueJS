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
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Paiement Réussi !</h1>
        <p class="text-gray-600 mb-6">
          Votre abonnement a été renouvelé avec succès.
        </p>

        <!-- Payment Details -->
        <div class="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-sm text-gray-600">Plan :</span>
              <span class="text-sm font-medium">{{ paymentDetails.plan || 'Essentiel' }}</span>
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
            @click="goToDashboard"
            class="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Retour au tableau de bord
          </button>

          <button
            @click="goToSettings"
            class="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
          >
            Voir mes paramètres
          </button>
        </div>

        <!-- Footer -->
        <p class="text-xs text-gray-500 mt-6">
          Sécurisé par PayDunya • Transaction #{{ paymentDetails.token || 'N/A' }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { CheckCircle } from 'lucide-vue-next';
import { useUser } from '../composables/useUser.js';

const router = useRouter();
const { user, currentPlan, updateSubscriptionLocally } = useUser();

const paymentDetails = ref({
  token: '',
  status: '',
  plan: '',
  amount: ''
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

const goToDashboard = () => {
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

  paymentDetails.value = {
    token: token || 'N/A',
    status: status || 'completed',
    plan: currentPlan.value?.name || 'Essentiel',
    amount: currentPlan.value?.price ? `${currentPlan.value.price} ${currentPlan.value.currency}` : '5 000 FCFA'
  };

  // Mettre à jour l'abonnement si le paiement est réussi
  if (status === 'completed') {
    try {
      // Mettre à jour localement la date d'expiration
      const newExpiryDate = new Date();
      newExpiryDate.setMonth(newExpiryDate.getMonth() + 1); // +1 mois

      updateSubscriptionLocally({
        currentPeriodEnd: newExpiryDate.toISOString().split('T')[0],
        status: 'active'
      });

      console.log('Abonnement renouvelé avec succès jusqu\'au:', newExpiryDate.toISOString().split('T')[0]);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'abonnement:', error);
    }
  }
});
</script>