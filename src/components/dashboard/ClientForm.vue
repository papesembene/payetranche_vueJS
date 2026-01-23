<script setup>
import { ref, watch } from 'vue';
import { X, User, Phone, Home, CheckCircle, DollarSign } from 'lucide-vue-next';
import Swal from 'sweetalert2';
import { clientService } from '../../services/client.service.js';
import { useUserStore } from '../../stores/user.js';

const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  client: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'saved', 'addPayment']);

const userStore = useUserStore();

const form = ref({
  name: '',
  address: '',
  phone: '',
  totalDebt: 0
});
const loading = ref(false);
const currentStep = ref(1);
const totalSteps = 3;
const showPaymentPrompt = ref(false);
const savedClient = ref(null);

const resetForm = () => {
  form.value = {
    name: '',
    address: '',
    phone: '',
    totalDebt: 0
  };
};

// Watch for client prop changes (for editing)
watch(() => props.client, (newClient) => {
  if (newClient) {
    form.value = {
      name: newClient.name || '',
      address: newClient.address || '',
      phone: newClient.phone || '',
      totalDebt: newClient.totalDebt || 0
    };
  } else {
    resetForm();
  }
}, { immediate: true });

// Watch for show prop to reset form when opening
watch(() => props.show, (show) => {
  if (show && !props.client) {
    resetForm();
    currentStep.value = 1;
    speak('Étape 1: Entrez le nom du client');
  }
});

// Watch for step changes to speak instructions
watch(() => currentStep.value, (newStep) => {
  if (newStep === 1) speak('Étape 1: Entrez le nom du client');
  else if (newStep === 2) speak('Étape 2: Entrez le numéro de téléphone');
  else if (newStep === 3) speak('Étape 3: Entrez l\'adresse et le montant de la dette');
});


const handleStepAction = async () => {
  if (currentStep.value < totalSteps) {
    // Validation per step
    if (currentStep.value === 1) {
      if (!form.value.name.trim() || form.value.name.length < 2) {
        alert('Veuillez entrer le nom complet du client (au moins 2 caractères)');
        return;
      }
    }
    if (currentStep.value === 2) {
      // Regex pour valider les numéros sénégalais
      // Formats acceptés: 77 123 45 67, 7712345678, +221 77 123 45 67, +22177123456, 221771234567
      const phoneRegex = /^(\+221|221)?[7][01567-8]\d{7}$/;
      const cleanPhone = form.value.phone.replace(/\s/g, '');
      if (!form.value.phone.trim() || !phoneRegex.test(cleanPhone)) {
        alert('Numéro de téléphone invalide. Exemples valides : 77 123 45 67 ou +221 77 123 45 67');
        return;
      }
    }
    if (currentStep.value === 3) {
      if (!form.value.address.trim()) {
        alert('Veuillez entrer l\'adresse du client');
        return;
      }
      if (form.value.totalDebt < 0) {
        alert('Le montant de la dette ne peut pas être négatif');
        return;
      }
    }
    nextStep();
  } else {
    // Last step: submit
    await submitForm();
  }
};

const submitForm = async () => {
  // Check subscription status before submitting
  if (!userStore.canAddClient) {
    alert('Vous ne pouvez pas ajouter de clients. Vérifiez votre abonnement ou vos limites.');
    return;
  }

  loading.value = true;
  try {
    // Nettoyer le numéro de téléphone (enlever +221 et espaces)
    const cleanPhone = form.value.phone.replace(/\s/g, '').replace(/^\+?221/, '');

    const clientData = {
      ...form.value,
      phone: cleanPhone, // Sauvegarder sans +221
      userId: userStore.user?.id,
      status: 'active',
      createdAt: new Date().toISOString()
    };

    if (props.client) {
      // Update existing client
      savedClient.value = await clientService.updateClient(props.client.id, clientData);
    } else {
      // Create new client
      savedClient.value = await clientService.createClient(clientData);
    }

    // After saving, show success
    speak('Client enregistré avec succès');
    Swal.fire({
      title: 'Succès!',
      text: 'Client enregistré avec succès',
      icon: 'success',
      confirmButtonText: 'OK',
      customClass: {
        popup: 'rounded-2xl',
        confirmButton: 'bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-4 rounded-xl'
      }
    }).then(() => {
      showPaymentPrompt.value = true;
    });

    // Return the saved client for payment form
    return savedClient;
  } catch (error) {
    console.error('Erreur sauvegarde client:', error);
    alert(error.message || 'Une erreur est survenue lors de la sauvegarde. Veuillez réessayer.');
  } finally {
    loading.value = false;
  }
};

const nextStep = () => {
  if (currentStep.value < totalSteps) {
    currentStep.value++;
  }
};

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--;
  }
};

const speak = (text) => {
  if ('speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    speechSynthesis.speak(utterance);
  }
};


const closeModal = () => {
  emit('close');
};
</script>

<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 class="text-xl font-bold text-gray-900">
          {{ client ? 'Modifier le client' : 'Nouveau client' }}
        </h2>
        <button
          @click="closeModal"
          class="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <X :size="24" class="text-gray-500" />
        </button>
      </div>

      <!-- Step Indicator -->
      <div class="px-6 py-4">
        <div class="flex items-center justify-center gap-2">
          <div v-for="step in totalSteps" :key="step" class="flex items-center">
            <div
              :class="[
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold',
                step <= currentStep ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-600'
              ]"
            >
              {{ step }}
            </div>
            <div v-if="step < totalSteps" :class="['w-8 h-1', step < currentStep ? 'bg-teal-500' : 'bg-gray-200']"></div>
          </div>
        </div>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleStepAction" class="p-6 space-y-6">
        <!-- Step 1: Name -->
        <div v-if="currentStep === 1" class="text-center">
          <div class="mb-4">
            <User :size="64" class="text-teal-500" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Nom du client</h3>
          <input
            v-model="form.name"
            type="text"
            required
            class="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="Entrez le nom complet"
          />
        </div>

        <!-- Step 2: Phone -->
        <div v-if="currentStep === 2" class="text-center">
          <div class="mb-4">
            <Phone :size="64" class="text-teal-500" />
          </div>
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Téléphone</h3>
          <input
            v-model="form.phone"
            type="tel"
            required
            class="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="+221 XX XXX XX XX"
          />
        </div>

        <!-- Step 3: Address and Debt -->
        <div v-if="currentStep === 3" class="space-y-6">
          <div class="text-center mb-6">
            <div class="mb-4">
              <Home :size="64" class="text-teal-500" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-4">Adresse et dette</h3>
          </div>

          <div class="grid grid-cols-1 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Adresse domicile
              </label>
              <input
                v-model="form.address"
                type="text"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Dakar, Plateau"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                💰 Total dette (FCFA)
              </label>
              <input
                v-model.number="form.totalDebt"
                type="number"
                min="0"
                step="100"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="0"
              />
            </div>
          </div>
        </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-6 border-t border-gray-200">
        <button
          v-if="currentStep > 1"
          type="button"
          @click="prevStep"
          class="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          Précédent
        </button>
        <button
          type="button"
          @click="closeModal"
          class="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          :disabled="loading"
          class="flex-1 px-6 py-4 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold text-lg rounded-xl transition-colors"
        >
          {{ loading ? 'Sauvegarde...' : (currentStep === totalSteps ? (client ? 'Modifier' : 'Créer') : 'Suivant') }}
        </button>
      </div>
    </form>
    </div>
  </div>

  <!-- Payment Prompt Modal -->
  <div v-if="showPaymentPrompt" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div class="bg-white rounded-2xl max-w-md w-full p-6 text-center">
      <div class="mb-4">
        <DollarSign :size="64" class="text-teal-500 mx-auto" />
      </div>
      <h3 class="text-lg font-semibold text-gray-900 mb-4">Ajouter un paiement ?</h3>
      <p class="text-gray-600 mb-6">Voulez-vous enregistrer un paiement pour ce client maintenant ?</p>
      <div class="flex gap-3">
        <button
          @click="showPaymentPrompt = false; emit('saved'); emit('close')"
          class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
        >
          Plus tard
        </button>
        <button
          @click="emit('addPayment', savedClient.value || form); emit('saved'); showPaymentPrompt = false; emit('close')"
          class="flex-1 px-4 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors"
        >
          Ajouter paiement
        </button>
      </div>
    </div>
  </div>
</template>