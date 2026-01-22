<template>
  <div v-if="showPrompt" class="bg-gradient-to-r from-teal-500 to-teal-600 text-white p-4 rounded-lg shadow-lg">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <div class="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <Zap :size="16" />
        </div>
        <div>
          <h4 class="font-semibold">{{ promptData.title }}</h4>
          <p class="text-sm text-teal-100">{{ promptData.message }}</p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          v-if="!isSubscriptionExpired"
          @click="dismiss"
          class="px-3 py-1 text-sm text-teal-200 hover:text-white transition-colors"
        >
          Plus tard
        </button>
        <button
          @click="upgrade"
          class="px-4 py-1 bg-white text-teal-600 text-sm font-medium rounded-md hover:bg-teal-50 transition-colors"
        >
          {{ promptData.buttonText }}
        </button>
      </div>
    </div>

    <!-- Close button -->
    <button
      @click="dismiss"
      class="absolute top-2 right-2 text-teal-200 hover:text-white"
    >
      <X :size="16" />
    </button>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { Zap, X } from 'lucide-vue-next';
import { useUserStore } from '../stores/user.js';

const userStore = useUserStore();
const user = computed(() => userStore.user);
const subscriptionStatus = computed(() => userStore.subscriptionStatus);
const isSubscriptionExpired = computed(() => userStore.isSubscriptionExpired);

const showPrompt = ref(false);
const promptData = ref({
  title: '',
  message: '',
  buttonText: 'Mettre à niveau'
});

// Logique pour déterminer quand afficher l'invite
const shouldShowPrompt = computed(() => {
  // Ne pas afficher si données pas chargées
  if (!user.value || !subscriptionStatus.value) {
    return null;
  }

  // PRIORITÉ 1: Montrer si abonnement expiré
  if (isSubscriptionExpired.value) {
    return {
      title: 'Abonnement expiré',
      message: 'Votre abonnement a expiré. Renouvelez-le pour continuer à utiliser toutes les fonctionnalités.',
      buttonText: 'Renouveler maintenant'
    };
  }

  // Montrer si limites approchées
  if (user.value.usage && (user.value.usage.clients >= 45 || user.value.usage.payments >= 400)) { // Mock limits
    return {
      title: 'Limite atteinte',
      message: 'Vous avez atteint vos limites d\'utilisation. Mettez à niveau pour continuer.',
      buttonText: 'Voir les plans'
    };
  }

  // Montrer si abonnement expire bientôt
  const daysLeft = subscriptionStatus.value.currentPeriodEnd ?
    Math.ceil((new Date(subscriptionStatus.value.currentPeriodEnd) - new Date()) / (1000 * 60 * 60 * 24)) : 30;

  if (daysLeft <= 7 && daysLeft > 0) {
    return {
      title: 'Renouvellement bientôt',
      message: `Votre abonnement se renouvelle dans ${daysLeft} jour(s).`,
      buttonText: 'Gérer abonnement'
    };
  }

  return null;
});

// Vérifier si l'invite a déjà été rejetée récemment
const checkDismissed = () => {
  const dismissed = localStorage.getItem('upgrade_prompt_dismissed');
  if (!dismissed) return false;

  const dismissedTime = new Date(dismissed);
  const now = new Date();
  const hoursDiff = (now - dismissedTime) / (1000 * 60 * 60);

  // Réafficher après 24 heures
  return hoursDiff < 24;
};

const updatePrompt = () => {
  const prompt = shouldShowPrompt.value;
  if (prompt && (!checkDismissed() || isSubscriptionExpired.value)) {
    promptData.value = prompt;
    showPrompt.value = true;
  } else {
    showPrompt.value = false;
  }
};

const dismiss = () => {
  localStorage.setItem('upgrade_prompt_dismissed', new Date().toISOString());
  showPrompt.value = false;
};

const upgrade = () => {
  // Émettre l'événement pour ouvrir la modale de mise à niveau
  emit('upgrade');
  dismiss(); // Masquer l'invite après clic
};

// Écouter les changements d'utilisation (seulement si user existe)
watch(() => user.value?.usage, updatePrompt, { deep: true });
watch(() => subscriptionStatus.value, updatePrompt, { deep: true });

onMounted(() => {
  updatePrompt();
});

defineEmits(['upgrade']);
</script>