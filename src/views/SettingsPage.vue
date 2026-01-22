<template>
  <div class="min-h-screen bg-gray-50">
    <DashboardHeader />

    <main class="max-w-4xl mx-auto px-6 lg:px-8 py-8">
      <!-- Page Title -->
      <div class="mb-8">
        <button
          @click="$router.push('/dashboard')"
          class="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft :size="20" />
          <span>Retour au tableau de bord</span>
        </button>
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Paramètres</h1>
        <p class="text-gray-600">Gérez votre compte et votre abonnement</p>
      </div>

      <!-- Tabs -->
      <div class="bg-white rounded-lg shadow-sm mb-6">
        <div class="border-b border-gray-200">
          <nav class="flex">
            <button
              @click="activeTab = 'profile'"
              :class="[
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'profile'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              ]"
            >
              Profil
            </button>
            <button
              @click="activeTab = 'subscription'"
              :class="[
                'px-6 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === 'subscription'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              ]"
            >
              Abonnement
            </button>
          </nav>
        </div>

        <!-- Profile Tab -->
        <div v-if="activeTab === 'profile'" class="p-6">
          <!-- Loading State -->
          <div v-if="loading || !user" class="animate-pulse">
            <div class="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="h-10 bg-gray-200 rounded"></div>
                <div class="h-10 bg-gray-200 rounded"></div>
              </div>
              <div class="h-10 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>

          <!-- Profile Form -->
          <div v-else-if="user">
            <h2 class="text-xl font-semibold text-gray-900 mb-6">Informations du profil</h2>

            <form @submit.prevent="updateProfile" class="space-y-6">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                    Nom complet
                  </label>
                  <input
                    id="name"
                    v-model="profileForm.name"
                    type="text"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>

                <div>
                  <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                    Numéro de téléphone
                  </label>
                  <input
                    id="phone"
                    v-model="profileForm.phone"
                    type="tel"
                    class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  :disabled="loading"
                  class="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:opacity-50"
                >
                  {{ loading ? 'Mise à jour...' : 'Mettre à jour le profil' }}
                </button>
              </div>
            </form>
          </div>
        </div>

        <!-- Subscription Tab -->
        <div v-if="activeTab === 'subscription'" class="p-6">
          <!-- Loading State for Subscription -->
          <div v-if="loading" class="animate-pulse">
            <div class="flex items-center justify-between mb-6">
              <div class="h-6 bg-gray-200 rounded w-1/3"></div>
              <div class="text-right">
                <div class="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                <div class="h-5 bg-gray-200 rounded w-16"></div>
              </div>
            </div>
            <div class="h-32 bg-gray-200 rounded mb-6"></div>
            <div class="h-20 bg-gray-200 rounded"></div>
          </div>

          <!-- Subscription Content -->
          <div v-else-if="user && currentPlan">
            <div class="flex items-center justify-between mb-6">
              <h2 class="text-xl font-semibold text-gray-900">Gestion de l'abonnement</h2>
              <div class="text-right">
                <div class="text-sm text-gray-600">Plan actuel</div>
                <div class="font-semibold text-gray-900">{{ currentPlan.name }}</div>
              </div>
            </div>

          <!-- Current Subscription Info -->
          <div class="bg-gray-50 rounded-lg p-4 mb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div class="text-sm text-gray-600">Statut</div>
                <div class="font-medium text-gray-900 capitalize">{{ getStatusLabel(subscriptionStatus.status) }}</div>
              </div>
              <div>
                <div class="text-sm text-gray-600">
                  {{ subscriptionStatus.status === 'trial' ? 'Expiration de l\'essai' : 'Renouvellement' }}
                </div>
                <div class="font-medium text-gray-900">
                  {{ getEffectiveEndDate() ? formatDate(getEffectiveEndDate()) : 'Non défini' }}
                </div>
              </div>
              <div>
                <div class="text-sm text-gray-600">Prix</div>
                <div class="font-medium text-gray-900">
                  <template v-if="currentPlan?.id === 'free'">
                    Essai gratuit ({{ daysUntilExpiry }} jours restants)
                  </template>
                  <template v-else>
                    {{ currentPlan?.price || 0 }} {{ currentPlan?.currency || 'FCFA' }}/{{ currentPlan?.billing || 'mensuel' }}
                  </template>
                </div>
              </div>
            </div>
          </div>

          <!-- Plan Selection - UNIQUEMENT si abonnement expiré ou essai -->
          <div v-if="canChangePlan" class="mb-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">
              {{ subscriptionStatus.status === 'trial' ? 'Choisir un plan payant' : 'Changer de plan' }}
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div
                v-for="(plan, key) in subscriptionPlans"
                :key="key"
                :class="[
                  'border rounded-lg p-4 cursor-pointer transition-all',
                  currentPlan?.id === key
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-teal-300'
                ]"
                @click="selectedPlan = key"
              >
                <div class="flex items-center justify-between mb-2">
                  <h4 class="font-medium text-gray-900">{{ plan.name }}</h4>
                  <input
                    type="radio"
                    :value="key"
                    v-model="selectedPlan"
                    :disabled="currentPlan?.id === key"
                    class="text-teal-500"
                  />
                </div>
                <div class="text-2xl font-bold text-gray-900 mb-1">
                  <template v-if="plan.id === 'free'">
                    Essai gratuit
                    <span class="text-sm font-normal text-gray-600 block">14 jours</span>
                  </template>
                  <template v-else>
                    {{ plan.price }} {{ plan.currency }}
                    <span class="text-sm font-normal text-gray-600">/{{ plan.billing }}</span>
                  </template>
                </div>
                <p class="text-sm text-gray-600">{{ plan.description }}</p>
                <div v-if="plan.id === 'free'" class="mt-2 flex items-center gap-1 text-xs text-orange-600 font-medium">
                  <AlertTriangle :size="12" />
                  <span>Période d'essai limitée</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Message pour abonnements actifs - pas de changement possible -->
          <div v-else-if="subscriptionStatus.status === 'active'" class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <h3 class="text-lg font-medium text-yellow-900 mb-2">Changement de plan non disponible</h3>
            <p class="text-sm text-yellow-800">
              Les changements de plan ne sont possibles que lorsque votre abonnement a expiré ou pendant la période d'essai.
              Vous ne pouvez pas changer de plan pendant un abonnement actif.
            </p>
          </div>

          <!-- Action Buttons - UNIQUEMENT si changement possible -->
          <div v-if="canChangePlan" class="flex items-center justify-between mb-6">
            <div>
              <!-- Bouton de réactivation seulement si annulé -->
              <button
                v-if="subscriptionStatus.cancelAtPeriodEnd"
                @click="reactivateSubscription"
                :disabled="loading"
                class="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
              >
                Réactiver l'abonnement
              </button>
            </div>

            <!-- Bouton de mise à jour du plan -->
            <button
              v-if="selectedPlan && selectedPlan !== currentPlan?.id"
              @click="updatePlan"
              :disabled="loading"
              class="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:opacity-50"
            >
              {{ loading ? 'Mise à jour...' : 'Mettre à jour le plan' }}
            </button>
          </div>

          <!-- Section Renouvellement - si expiré ou approche expiration -->
          <div v-if="canRenew" class="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 class="text-lg font-medium text-blue-900 mb-2">
              {{ subscriptionStatus.status === 'expired' ? 'Renouveler votre abonnement' : 'Renouvellement anticipé' }}
            </h3>
            <p class="text-sm text-blue-700 mb-4">
              <template v-if="subscriptionStatus.status === 'expired'">
                Votre abonnement a expiré. Renouvelez maintenant pour continuer à utiliser PayTranche.
              </template>
              <template v-else>
                Votre abonnement arrive à expiration dans {{ daysUntilExpiry }} jour{{ daysUntilExpiry > 1 ? 's' : '' }}.
                Vous pouvez le renouveler maintenant pour éviter toute interruption.
              </template>
            </p>

            <div class="space-y-3">
              <button
                @click="renewSubscription"
                :disabled="loading"
                class="w-full px-4 py-3 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Smartphone :size="18" />
                {{ subscriptionStatus.status === 'expired' ? 'Renouveler maintenant' : 'Renouveler anticipé' }}
              </button>

              <button
                v-if="subscriptionStatus.status !== 'expired'"
                @click="setupRecurringPayment"
                :disabled="loading"
                class="w-full px-4 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <CreditCard :size="18" />
                Configurer le renouvellement automatique
              </button>
            </div>

            <div class="mt-3 text-sm text-gray-600 text-center">
              Sécurisé par <strong>PayDunya</strong> - Gateway de paiement africain
            </div>
          </div>

          <!-- Message pour renouvellements actifs -->
          <div v-else-if="subscriptionStatus.status === 'active'" class="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 class="text-lg font-medium text-gray-900 mb-2">Renouvellement automatique</h3>
            <p class="text-sm text-gray-700 mb-3">
              Configurez le renouvellement automatique pour éviter les interruptions de service.
            </p>
            <p class="text-sm text-gray-600 mb-3">
              Disponible {{ daysUntilExpiry <= 7 ? 'maintenant' : `dans ${daysUntilExpiry - 7} jours` }} (7 jours avant expiration).
            </p>
            <p v-if="daysUntilExpiry <= 7" class="text-sm text-blue-600 font-medium">
              💡 Vous pouvez aussi renouveler manuellement maintenant pour éviter toute interruption.
            </p>
          </div>

          <!-- Cancellation Notice -->
          <div v-if="subscriptionStatus.cancelAtPeriodEnd" class="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p class="text-sm text-yellow-800">
              Votre abonnement sera annulé le {{ formatDate(getEffectiveEndDate()) }}.
              Vous garderez accès à toutes les fonctionnalités jusqu'à cette date.
            </p>
          </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ArrowLeft, Smartphone, CreditCard, Clock, AlertTriangle } from 'lucide-vue-next';
import DashboardHeader from '../components/dashboard/DashboardHeader.vue';
import { useUser } from '../composables/useUser.js';
import { payDunyaService } from '../services/payDunya.service.js';

const {
  user,
  subscriptionPlans,
  currentPlan,
  subscriptionStatus,
  daysUntilExpiry,
  updateProfile,
  updateSubscription,
  cancelSubscription,
  reactivateSubscription,
  loadUser,
  loading
} = useUser();

const activeTab = ref('profile');
const selectedPlan = ref('');

// Initialize form when user data is available
const profileForm = computed(() => ({
  name: user.value?.name || '',
  phone: user.value?.phone || ''
}));

// Vérifier si l'utilisateur peut changer de plan
const canChangePlan = computed(() => {
  return subscriptionStatus.value?.status === 'expired' ||
         subscriptionStatus.value?.status === 'trial';
  // Note: Plan changes are NOT allowed during active subscriptions
  // Only when expired or in trial period
});

// Vérifier si l'utilisateur peut renouveler
const canRenew = computed(() => {
  return subscriptionStatus.value?.status === 'expired' ||
         (subscriptionStatus.value?.status === 'active' && daysUntilExpiry.value <= 7);
});

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

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('fr-FR');
};

const getEffectiveEndDate = () => {
  if (!subscriptionStatus.value) return null;
  
  // Pour les utilisateurs en période d'essai, utiliser trialEnd
  if (subscriptionStatus.value.status === 'trial') {
    return subscriptionStatus.value.trialEnd;
  }
  
  // Pour les autres statuts, utiliser currentPeriodEnd
  return subscriptionStatus.value.currentPeriodEnd;
};

const renewSubscription = async () => {
  if (!currentPlan.value) return;

  loading.value = true;
  try {
    const result = await payDunyaService.processSubscriptionRenewal(
      currentPlan.value.id,
      user.value
    );

    if (result.success) {
      // Rediriger vers PayDunya pour le paiement
      window.location.href = result.payment_url;
    }
  } catch (error) {
    alert('Erreur lors du renouvellement: ' + error.message);
  } finally {
    loading.value = false;
  }
};

const updatePlan = async () => {
  if (!selectedPlan.value || selectedPlan.value === currentPlan.value?.id) return;

  loading.value = true;
  try {
    const result = await updateSubscription(selectedPlan.value);

    if (result.success) {
      alert(`Plan mis à jour avec succès ! Vous êtes maintenant sur ${subscriptionPlans.value[selectedPlan.value]?.name}`);
      // Recharger les données utilisateur
      await loadUser();
    } else {
      alert('Erreur lors de la mise à jour du plan: ' + result.error);
    }
  } catch (error) {
    alert('Erreur lors de la mise à jour du plan: ' + error.message);
  } finally {
    loading.value = false;
  }
};

const setupRecurringPayment = async () => {
  if (!currentPlan.value) return;

  loading.value = true;
  try {
    const result = await payDunyaService.setupRecurringPayment(
      currentPlan.value.id,
      user.value
    );

    if (result.success) {
      alert('Renouvellement automatique configuré avec succès !');
      // Recharger les données utilisateur
      await loadUser();
    }
  } catch (error) {
    alert('Erreur lors de la configuration: ' + error.message);
  } finally {
    loading.value = false;
  }
};

// Watch for currentPlan changes to set selectedPlan
watch(() => currentPlan.value?.id, (newId) => {
  if (newId) {
    selectedPlan.value = newId;
  }
}, { immediate: true });
</script>