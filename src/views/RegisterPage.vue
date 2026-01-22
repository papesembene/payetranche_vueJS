<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 px-4 py-12">
    <!-- Register Card -->
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="flex justify-center mb-8">
        <div class="bg-white rounded-2xl shadow-lg px-6 py-3 flex items-center gap-3">
          <div class="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
            <DollarSign :size="24" :stroke-width="2.5" class="text-white" />
          </div>
          <span class="text-2xl font-bold text-gray-900">PayTranche</span>
        </div>
      </div>

      <!-- Register Form Card -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- Welcome Text -->
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Créer un compte</h1>
        <p class="text-gray-600 mb-8">Commencez votre essai gratuit de 14 jours</p>

        <!-- General Error Message -->
        <div v-if="errors.general" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {{ errors.general }}
        </div>

        <form @submit.prevent="handleRegister" class="space-y-6">
          <!-- Name Field -->
          <div>
            <label for="name" class="block text-sm font-semibold text-gray-700 mb-2">
              Nom complet
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User :size="20" class="text-gray-400" />
              </div>
              <input
                id="name"
                v-model="form.name"
                type="text"
                placeholder="Votre nom complet"
                :class="['w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all', errors.name ? 'border-red-500' : 'border-gray-300']"
              />
            </div>
            <p v-if="errors.name" class="text-xs text-red-600 mt-1">{{ errors.name }}</p>
          </div>

          <!-- Phone Field -->
          <div>
            <label for="phone" class="block text-sm font-semibold text-gray-700 mb-2">
              Numéro de téléphone
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Phone :size="20" class="text-gray-400" />
              </div>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                placeholder="77 123 45 67"
                :class="['w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all', errors.phone ? 'border-red-500' : 'border-gray-300']"
              />
            </div>
            <p class="text-xs text-gray-500 mt-1">Exemple: 77 123 45 67 (sans +221)</p>
            <p v-if="errors.phone" class="text-xs text-red-600 mt-1">{{ errors.phone }}</p>
          </div>

          <!-- Terms Checkbox -->
          <div class="flex items-start gap-3">
            <input
              id="terms"
              v-model="form.acceptTerms"
              type="checkbox"
              :class="['mt-1 w-4 h-4 border-gray-300 rounded focus:ring-teal-500', errors.terms ? 'border-red-500' : 'text-teal-500']"
            />
            <label for="terms" class="text-sm text-gray-600">
              J'accepte les
              <a href="#" class="text-teal-500 hover:text-teal-600 font-medium">Conditions d'utilisation</a>
              et la
              <a href="#" class="text-teal-500 hover:text-teal-600 font-medium">Politique de confidentialité</a>
            </label>
          </div>
          <p v-if="errors.terms" class="text-xs text-red-600 mt-1">{{ errors.terms }}</p>

          <!-- Register Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {{ loading ? 'Création du compte...' : 'Créer mon compte' }}
          </button>
        </form>

        <!-- Trial Info -->
        <div class="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
          <div class="flex items-center gap-2 text-teal-800">
            <Gift :size="20" />
            <span class="font-medium">Essai gratuit de 14 jours</span>
          </div>
          <p class="text-sm text-teal-700 mt-1">
            Accès complet à toutes les fonctionnalités sans carte bancaire
          </p>
        </div>

        <!-- Login Link -->
        <p class="text-center text-sm text-gray-600 mt-6">
          Déjà un compte ?
          <router-link to="/login" class="text-teal-500 hover:text-teal-600 font-medium transition-colors">
            Se connecter
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { DollarSign, User, Phone, Gift } from 'lucide-vue-next';
import { useUser } from '../composables/useUser.js';

const router = useRouter();
const { register } = useUser();

const form = ref({
  name: '',
  phone: '',
  acceptTerms: false
});

const loading = ref(false);
const errors = ref({});

const validateName = (name) => {
  if (!name || name.trim() === '') {
    return 'Le nom complet est requis';
  }
  if (name.trim().length < 2) {
    return 'Le nom doit contenir au moins 2 caractères';
  }
  return null;
};

const validateSenegalesePhone = (phoneNumber) => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return 'Le numéro de téléphone est requis';
  }
  // Remove spaces and +221 prefix if present
  const cleaned = phoneNumber.replace(/\s+/g, '').replace(/^\+221/, '');
  // Check if starts with valid prefixes and has 9 digits total
  const validPrefixes = ['70', '71', '75', '76', '77', '78'];
  if (cleaned.length !== 9 || !validPrefixes.some(prefix => cleaned.startsWith(prefix))) {
    return 'Numéro invalide. Utilisez un numéro sénégalais (70,71,75,76,77,78)';
  }
  return null;
};

const handleRegister = async () => {
  errors.value = {};

  const nameError = validateName(form.value.name);
  if (nameError) {
    errors.value.name = nameError;
  }

  const phoneError = validateSenegalesePhone(form.value.phone);
  if (phoneError) {
    errors.value.phone = phoneError;
  }

  if (!form.value.acceptTerms) {
    errors.value.terms = 'Vous devez accepter les conditions d\'utilisation';
  }

  if (Object.keys(errors.value).length > 0) {
    return;
  }

  loading.value = true;
  try {
    const result = await register({
      name: form.value.name,
      phone: form.value.phone
    });

    if (result.success) {
      alert('Compte créé avec succès ! Vous pouvez maintenant vous connecter.');
      router.push('/login');
    } else {
      errors.value.general = 'Erreur lors de la création du compte: ' + result.error;
    }
  } catch (error) {
    errors.value.general = 'Erreur lors de la création du compte: ' + error.message;
  } finally {
    loading.value = false;
  }
};
</script>