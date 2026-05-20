<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 px-4 py-6 sm:py-12 overflow-x-hidden">
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
      <div class="bg-white rounded-2xl shadow-xl">
        <!-- Header -->
        <div class="p-4 sm:p-6 pb-4">
          <!-- Welcome Text -->
          <h1 class="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Créer un compte</h1>
          <p class="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Commencez votre essai gratuit de 14 jours</p>

          <!-- Step Indicator -->
          <div class="flex items-center justify-center gap-1 sm:gap-2 mb-2">
            <div v-for="step in totalSteps" :key="step" class="flex items-center">
              <div
                :class="[
                  'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all',
                  step <= currentStep ? 'bg-teal-500 text-white' : 'bg-gray-200 text-gray-600'
                ]"
              >
                <CheckCircle v-if="step < currentStep" :size="12" :size-sm="16" class="sm:hidden" />
                <span v-if="step < currentStep" class="hidden sm:inline"><CheckCircle :size="16" /></span>
                <span v-else class="sm:hidden">{{ step }}</span>
                <span v-if="step === currentStep" class="hidden sm:inline">{{ step }}</span>
              </div>
              <div v-if="step < totalSteps" :class="['w-6 sm:w-12 h-1 mx-0.5 sm:mx-1', step < currentStep ? 'bg-teal-500' : 'bg-gray-200']"></div>
            </div>
          </div>
        </div>

        <!-- Error Message -->
        <div v-if="errors.general" class="mx-4 sm:mx-6 mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {{ errors.general }}
        </div>

        <div class="px-4 sm:px-6 pb-4 grid gap-3">
          <div ref="googleButtonEl" class="min-h-[44px] w-full flex justify-center"></div>
        </div>

        <div class="px-4 sm:px-6 flex items-center gap-3">
          <div class="h-px flex-1 bg-gray-200"></div>
          <span class="text-xs font-semibold text-gray-400">OU</span>
          <div class="h-px flex-1 bg-gray-200"></div>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleStepAction" class="p-4 sm:p-6 space-y-4">
          <!-- Step 1: Business & Identity -->
          <div v-if="currentStep === 1" class="space-y-4">
            <div class="text-center mb-4 sm:mb-6">
              <User :size="48" :size-sm="64" class="text-teal-500 mx-auto mb-2 sm:mb-4" />
              <h3 class="text-base sm:text-lg font-semibold text-gray-900">Vos informations</h3>
            </div>

            <div>
              <label for="businessName" class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Nom de l’entreprise</label>
              <input
                id="businessName"
                v-model="form.businessName"
                type="text"
                class="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="Ex: Boutique Ndiaye"
                :class="errors.businessName ? 'border-red-500' : ''"
              />
              <p v-if="errors.businessName" class="text-xs text-red-600 mt-1">{{ errors.businessName }}</p>
            </div>

            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Nom complet</label>
              <input
                id="name"
                v-model="form.name"
                type="text"
                class="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="Votre nom"
                :class="errors.name ? 'border-red-500' : ''"
              />
              <p v-if="errors.name" class="text-xs text-red-600 mt-1">{{ errors.name }}</p>
            </div>

            <div>
              <label for="phone" class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Téléphone</label>
              <input
                id="phone"
                v-model="form.phone"
                type="tel"
                class="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-base"
                placeholder="77 123 45 67"
                :class="errors.phone ? 'border-red-500' : ''"
              />
              <p class="text-xs text-gray-500 mt-1">77, 78, 70, 71, 75, 76</p>
              <p v-if="errors.phone" class="text-xs text-red-600 mt-1">{{ errors.phone }}</p>
            </div>
          </div>

          <!-- Step 2: Account security -->
          <div v-if="currentStep === 2" class="space-y-4">
            <div class="text-center mb-4 sm:mb-6">
              <Lock :size="48" :size-sm="64" class="text-teal-500 mx-auto mb-2 sm:mb-4" />
              <h3 class="text-base sm:text-lg font-semibold text-gray-900">Sécurisez votre compte</h3>
            </div>

            <div>
              <label for="email" class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Email professionnel</label>
              <input
                id="email"
                v-model="form.email"
                type="email"
                class="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="vous@entreprise.com"
                :class="errors.email ? 'border-red-500' : ''"
              />
              <p v-if="errors.email" class="text-xs text-red-600 mt-1">{{ errors.email }}</p>
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Mot de passe</label>
              <input
                id="password"
                v-model="form.password"
                type="password"
                class="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Minimum 8 caractères"
                :class="errors.password ? 'border-red-500' : ''"
              />
              <p v-if="errors.password" class="text-xs text-red-600 mt-1">{{ errors.password }}</p>
            </div>

            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">Confirmer le mot de passe</label>
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                type="password"
                class="w-full px-3 py-2.5 sm:px-4 sm:py-3 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                placeholder="Répétez le mot de passe"
                :class="errors.confirmPassword ? 'border-red-500' : ''"
              />
              <p v-if="errors.confirmPassword" class="text-xs text-red-600 mt-1">{{ errors.confirmPassword }}</p>
            </div>
          </div>

          <!-- Step 3: Terms & Submit -->
          <div v-if="currentStep === 3" class="space-y-4">
            <div class="text-center mb-4 sm:mb-6">
              <CheckCircle :size="48" :size-sm="64" class="text-teal-500 mx-auto mb-2 sm:mb-4" />
              <h3 class="text-base sm:text-lg font-semibold text-gray-900">Conditions d'utilisation</h3>
            </div>

            <div class="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50 rounded-lg sm:rounded-xl">
              <input
                id="terms"
                v-model="form.acceptTerms"
                type="checkbox"
                class="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 border-gray-300 rounded focus:ring-teal-500 flex-shrink-0"
              />
              <label for="terms" class="text-sm text-gray-600 leading-relaxed">
                J'accepte les
                <a href="#" class="text-teal-500 hover:text-teal-600 font-medium">Conditions</a>
                et la
                <a href="#" class="text-teal-500 hover:text-teal-600 font-medium">Politique de confidentialité</a>
              </label>
            </div>
            <p v-if="errors.terms" class="text-xs text-red-600">{{ errors.terms }}</p>

            <div class="p-3 sm:p-4 bg-teal-50 border border-teal-200 rounded-lg sm:rounded-xl">
              <div class="flex items-center gap-1.5 sm:gap-2 text-teal-800 mb-1">
                <Gift :size="16" :size-sm="20" />
                <span class="font-medium text-sm sm:text-base">Essai gratuit 14 jours</span>
              </div>
              <p class="text-xs sm:text-sm text-teal-700">
                Accès complet sans carte bancaire
              </p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4">
            <button
              type="submit"
              :disabled="loading"
              class="w-full sm:flex-1 px-4 py-2.5 sm:px-6 sm:py-3 bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-semibold rounded-lg sm:rounded-xl transition-colors text-sm sm:text-base"
            >
              {{ loading ? 'Création...' : (currentStep === totalSteps ? 'Créer mon compte' : 'Suivant') }}
            </button>
            <div class="flex gap-2 sm:hidden">
              <button
                v-if="currentStep > 1"
                type="button"
                @click="prevStep"
                class="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Précédent
              </button>
              <button
                type="button"
                @click="goToLogin"
                class="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Annuler
              </button>
            </div>
            <div class="hidden sm:flex gap-3 flex-1">
              <button
                v-if="currentStep > 1"
                type="button"
                @click="prevStep"
                class="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Précédent
              </button>
              <button
                type="button"
                @click="goToLogin"
                class="flex-1 px-4 py-2.5 sm:px-6 sm:py-3 border border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </form>

        <!-- Login Link -->
        <div class="p-4 sm:p-6 pt-0">
          <p class="text-center text-sm text-gray-600">
            Déjà un compte ?
            <router-link
              :to="{ path: '/login', query: route.query.redirect ? { redirect: route.query.redirect } : {} }"
              class="text-teal-500 hover:text-teal-600 font-medium"
            >
              Se connecter
            </router-link>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DollarSign, User, Lock, CheckCircle, Gift } from 'lucide-vue-next';
import { useUser } from '../composables/useUser.js';
import { authService } from '../services/auth.service.js';
import { getPostAuthPath, getSafeRedirectPath } from '../utils/access.js';

const router = useRouter();
const route = useRoute();
const { register, googleCredentialLogin } = useUser();

const form = ref({
  businessName: '',
  name: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false
});

const loading = ref(false);
const errors = ref({});
const currentStep = ref(1);
const totalSteps = 3;
const googleButtonEl = ref(null);

const getRedirectPath = () => {
  return getSafeRedirectPath(route.query.redirect);
};

const goAfterAuth = (user) => {
  const redirectPath = getRedirectPath();
  const nextPath = getPostAuthPath(user, redirectPath);

  if (nextPath === '/admin') {
    router.push('/admin');
    return;
  }

  if (!user?.onboardingCompleted) {
    if (redirectPath) {
      localStorage.setItem('post_onboarding_redirect', redirectPath);
    }
    router.push(nextPath);
    return;
  }

  router.push(nextPath);
};

const validateName = (name) => {
  if (!name || name.trim() === '') return 'Le nom est requis';
  if (name.trim().length < 2) return 'Au moins 2 caractères';
  return null;
};

const validateBusinessName = (name) => {
  if (!name || name.trim() === '') return 'Le nom de l’entreprise est requis';
  if (name.trim().length < 2) return 'Au moins 2 caractères';
  return null;
};

const validatePhone = (phone) => {
  if (!phone || phone.trim() === '') return 'Le téléphone est requis';
  const cleaned = phone.replace(/\s+/g, '').replace(/^\+221/, '');
  const validPrefixes = ['70', '71', '75', '76', '77', '78'];
  if (cleaned.length !== 9 || !validPrefixes.some(prefix => cleaned.startsWith(prefix))) {
    return 'Numéro sénégalais requis (70,71,75,76,77,78)';
  }
  return null;
};

const validateEmail = (email) => {
  if (!email || email.trim() === '') return 'L’email est requis';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Email invalide';
  return null;
};

const validatePassword = (password) => {
  if (!password || password.length < 8) return 'Minimum 8 caractères';
  return null;
};

const handleStepAction = async () => {
  if (currentStep.value < totalSteps) {
    // Validation
    if (currentStep.value === 1) {
      errors.value = {};
      const businessNameError = validateBusinessName(form.value.businessName);
      const nameError = validateName(form.value.name);
      const phoneError = validatePhone(form.value.phone);
      if (businessNameError) errors.value.businessName = businessNameError;
      if (nameError) errors.value.name = nameError;
      if (phoneError) errors.value.phone = phoneError;
      if (businessNameError || nameError || phoneError) return;
    }
    if (currentStep.value === 2) {
      errors.value = {};
      const emailError = validateEmail(form.value.email);
      const passwordError = validatePassword(form.value.password);
      if (emailError) errors.value.email = emailError;
      if (passwordError) errors.value.password = passwordError;
      if (form.value.password !== form.value.confirmPassword) {
        errors.value.confirmPassword = 'Les mots de passe ne correspondent pas';
      }
      if (emailError || passwordError || errors.value.confirmPassword) {
        return;
      }
    }
    if (currentStep.value === 3) {
      if (!form.value.acceptTerms) {
        errors.value.terms = 'Accepter les conditions requis';
        return;
      }
    }
    currentStep.value++;
  } else {
    // Submit
    errors.value = {};
    loading.value = true;
    try {
      const result = await register({
        businessName: form.value.businessName,
        name: form.value.name,
        phone: form.value.phone,
        email: form.value.email,
        password: form.value.password
      });
      if (result.success) {
        goAfterAuth(result.user);
      } else {
        errors.value.general = 'Erreur: ' + result.error;
      }
    } catch (error) {
      errors.value.general = 'Erreur: ' + error.message;
    } finally {
      loading.value = false;
    }
  }
};

const mountGoogleButton = async () => {
  try {
    await authService.renderGoogleButton(googleButtonEl.value, {
      text: 'signup_with',
      onCredential: async (credential) => {
        errors.value = {};
        loading.value = true;
        try {
          const result = await googleCredentialLogin(credential, {
            companyName: form.value.businessName || undefined
          });

          if (result.success) {
            goAfterAuth(result.user);
          } else {
            errors.value.general = result.error || 'Inscription Google impossible';
          }
        } finally {
          loading.value = false;
        }
      },
      onError: (message) => {
        errors.value.general = message;
      }
    });
  } catch (error) {
    errors.value.general = error.message || 'Google Sign-In indisponible';
  }
};

onMounted(async () => {
  await mountGoogleButton();
});

const prevStep = () => {
  if (currentStep.value > 1) currentStep.value--;
};

const goToLogin = () => {
  router.push({
    path: '/login',
    query: route.query.redirect ? { redirect: route.query.redirect } : {}
  });
};
</script>
