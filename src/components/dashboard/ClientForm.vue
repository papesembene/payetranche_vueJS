<script setup>
import { ref, watch } from 'vue';
import { X, User, Phone, CreditCard } from 'lucide-vue-next';
import Swal from 'sweetalert2';
import { clientService } from '../../services/client.service.js';
import { useUserStore } from '../../stores/user.js';
import { useUser } from '../../composables/useUser.js';
import { getUserFriendlyError } from '../../utils/userFriendlyError.js';

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
const { updateUsage, syncUsageCounts } = useUser();

const form = ref({
  name: '',
  address: '',
  phone: '',
  totalDebt: 0,
  acompte: 0,
  dueDate: '',
  description: ''
});
const loading = ref(false);
const currentStep = ref(1);
const totalSteps = 3;
const savedClient = ref(null);

const resetForm = () => {
  form.value = {
    name: '',
    address: '',
    phone: '',
    totalDebt: 0,
    acompte: 0,
    dueDate: '',
    description: ''
  };
};

// Watch for client prop changes (for editing)
watch(() => props.client, (newClient) => {
  if (newClient) {
    form.value = {
      name: newClient.name || '',
      address: newClient.address || '',
      phone: newClient.phone || '',
      totalDebt: newClient.totalDebt || 0,
      acompte: newClient.acompte || 0,
      dueDate: '',
      description: ''
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
  else if (newStep === 3) speak('Étape 3: Entrez le montant que le client doit');
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
      if (!form.value.totalDebt || form.value.totalDebt <= 0) {
        alert('Entrez le montant que le client doit.');
        return;
      }
      if (form.value.acompte < 0) {
        alert('L’acompte ne peut pas être négatif.');
        return;
      }
      if (form.value.acompte > form.value.totalDebt) {
        alert('L’acompte ne peut pas dépasser le montant total.');
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
      // Create new client - increment usage via composable (which persists changes)
      savedClient.value = await clientService.createClient(clientData);
      // Update the usage counter and persist to localStorage
      updateUsage('clients', 1);
      // Force synchronization with real database count
      await syncUsageCounts();

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
      emit('saved');
      emit('close');
    });

    // Return the saved client for potential use
    return savedClient;
  } catch (error) {
    console.error('Erreur sauvegarde client:', error);
    alert(getUserFriendlyError(error, 'save'));
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
  // Voice guidance disabled - users found it distracting
  // if ('speechSynthesis' in window) {
  //   const utterance = new SpeechSynthesisUtterance(text);
  //   utterance.lang = 'fr-FR';
  //   speechSynthesis.speak(utterance);
  // }
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
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Téléphone du client</h3>
          <input
            v-model="form.phone"
            type="tel"
            required
            class="w-full px-4 py-4 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            placeholder="+221 XX XXX XX XX"
          />
        </div>

        <!-- Step 3: Initial Credit -->
        <div v-if="currentStep === 3" class="space-y-6">
          <div class="text-center mb-6">
            <div class="mb-4">
              <CreditCard :size="64" class="text-teal-500" />
            </div>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">Ce que le client doit</h3>
            <p class="text-sm text-gray-600">Notez le montant de la vente à crédit. Si le client donne une partie, mettez l’acompte.</p>
          </div>

          <div class="grid grid-cols-1 gap-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Montant total
              </label>
              <input
                v-model.number="form.totalDebt"
                type="number"
                min="1"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Ex: 10000"
                required
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Acompte reçu
              </label>
              <input
                v-model.number="form.acompte"
                type="number"
                min="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Ex: 5000"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Date limite
              </label>
              <input
                v-model="form.dueDate"
                type="date"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Adresse ou note
              </label>
              <input
                v-model="form.address"
                type="text"
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Ex: Dakar, Plateau"
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
          {{ loading ? 'Création en cours...' : (currentStep === totalSteps ? (client ? 'Modifier' : 'Enregistrer') : 'Suivant') }}
        </button>
      </div>
    </form>
    </div>
  </div>
</template>
