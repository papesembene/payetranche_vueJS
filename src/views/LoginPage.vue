<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Phone } from 'lucide-vue-next';
import { DollarSign } from 'lucide-vue-next';
import { useUser } from '../composables/useUser.js';

const router = useRouter();
const { login, loading } = useUser();

const phone = ref('');
const rememberMe = ref(false);
const errors = ref({});

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

const handleLogin = async () => {
  errors.value = {};
  const phoneError = validateSenegalesePhone(phone.value);
  if (phoneError) {
    errors.value.phone = phoneError;
    return;
  }

  const result = await login({
    phone: phone.value
  });

  if (result.success) {
    router.push('/dashboard');
  } else {
    errors.value.general = result.error || 'Erreur de connexion';
  }
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 px-4 py-12">
    <!-- Login Card -->
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

      <!-- Login Form Card -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- Welcome Text -->
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Bienvenue !</h1>
        <p class="text-gray-600 mb-8">Connectez-vous avec votre numéro de téléphone</p>

        <!-- Error Message -->
        <div v-if="errors.general" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {{ errors.general }}
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
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
                v-model="phone"
                type="tel"
                placeholder="77 123 45 67"
                :class="['w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all', errors.phone ? 'border-red-500' : 'border-gray-300']"
              />
            </div>
            <p class="text-xs text-gray-500 mt-1">Exemple: 77 123 45 67 (sans +221)</p>
            <p v-if="errors.phone" class="text-xs text-red-600 mt-1">{{ errors.phone }}</p>
          </div>

          <!-- Remember Me -->
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="rememberMe"
                type="checkbox"
                class="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
              />
              <span class="text-sm text-gray-600">Se souvenir de moi</span>
            </label>
          </div>

          <!-- Login Button -->
          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ loading ? 'Connexion...' : 'Se connecter' }}
          </button>
        </form>

        <!-- Sign Up Link -->
        <p class="text-center text-sm text-gray-600 mt-6">
          Vous n'avez pas de compte ?
          <router-link to="/register" class="text-teal-500 hover:text-teal-600 font-medium transition-colors">
            Créer un compte
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>