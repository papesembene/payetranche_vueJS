<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { Phone, Lock } from 'lucide-vue-next';
import { DollarSign } from 'lucide-vue-next';
import { useUser } from '../composables/useUser.js';

const router = useRouter();
const { login, loading } = useUser();

const phone = ref('');
const otp = ref('');
const generatedOtp = ref('');
const step = ref(1); // 1: phone, 2: otp
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

const validateOtp = (otpValue) => {
  if (!otpValue || otpValue.trim() === '') {
    return 'Le code OTP est requis';
  }
  if (otpValue.length !== 6 || !/^\d{6}$/.test(otpValue)) {
    return 'Le code OTP doit contenir 6 chiffres';
  }
  return null;
};

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const handleSendCode = () => {
  errors.value = {};
  const phoneError = validateSenegalesePhone(phone.value);
  if (phoneError) {
    errors.value.phone = phoneError;
    return;
  }
  generatedOtp.value = generateOtp();
  step.value = 2;
};

const handleLogin = async () => {
  errors.value = {};
  const otpError = validateOtp(otp.value);
  if (otpError) {
    errors.value.otp = otpError;
    return;
  }
  if (otp.value !== generatedOtp.value) {
    errors.value.otp = 'Code OTP incorrect';
    return;
  }

  // For mock, use phone as identifier
  const result = await login({
    phone: phone.value,
    otp: otp.value
  });

  if (result.success) {
    router.push('/dashboard');
  } else {
    errors.value.general = result.error || 'Erreur de connexion';
  }
};

const handleBack = () => {
  step.value = 1;
  otp.value = '';
  generatedOtp.value = '';
  errors.value = {};
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
        <p class="text-gray-600 mb-8">Connectez-vous pour accéder à votre tableau de bord</p>

        <!-- Error Message -->
        <div v-if="errors.general" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {{ errors.general }}
        </div>

        <form v-if="step === 1" @submit.prevent="handleSendCode" class="space-y-6">
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

          <!-- Send Code Button -->
          <button
            type="submit"
            class="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-md hover:shadow-lg"
          >
            Envoyer le code
          </button>
        </form>

        <form v-else @submit.prevent="handleLogin" class="space-y-6">
          <!-- OTP Display -->
          <div class="bg-teal-50 border border-teal-200 rounded-xl p-4">
            <p class="text-sm text-teal-800 font-medium mb-2">Votre code de vérification :</p>
            <p class="text-2xl font-bold text-teal-600 text-center">{{ generatedOtp }}</p>
            <p class="text-xs text-teal-600 mt-2">Saisissez ce code ci-dessous pour vous connecter</p>
          </div>

          <!-- OTP Input -->
          <div>
            <label for="otp" class="block text-sm font-semibold text-gray-700 mb-2">
              Code de vérification
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock :size="20" class="text-gray-400" />
              </div>
              <input
                id="otp"
                v-model="otp"
                type="text"
                placeholder="123456"
                maxlength="6"
                :class="['w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all text-center text-lg font-mono', errors.otp ? 'border-red-500' : 'border-gray-300']"
              />
            </div>
            <p v-if="errors.otp" class="text-xs text-red-600 mt-1">{{ errors.otp }}</p>
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
            <button
              type="button"
              @click="handleBack"
              class="text-sm text-teal-500 hover:text-teal-600 font-medium transition-colors"
            >
              Retour
            </button>
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