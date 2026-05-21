<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Mail, Lock, DollarSign } from 'lucide-vue-next';
import { useUser } from '../composables/useUser.js';
import { authService } from '../services/auth.service.js';
import { getPostAuthPath, getSafeRedirectPath } from '../utils/access.js';
import SocialAuthButtons from '../components/SocialAuthButtons.vue';

const router = useRouter();
const route = useRoute();
const { login, socialLogin, completeSocialLogin, loading } = useUser();

const email = ref('');
const password = ref('');
const errors = ref({});
const socialLoadingProvider = ref('');

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

const validateEmail = (value) => {
  if (!value || value.trim() === '') return 'L’email est requis';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Email invalide';
  return null;
};

const validatePassword = (value) => {
  if (!value) return 'Le mot de passe est requis';
  return null;
};

const handleLogin = async () => {
  errors.value = {};
  
  const emailError = validateEmail(email.value);
  if (emailError) {
    errors.value.email = emailError;
    return;
  }

  const passwordError = validatePassword(password.value);
  if (passwordError) {
    errors.value.password = passwordError;
    return;
  }

  const result = await login({
    email: email.value,
    password: password.value
  });

  if (result.success) {
    goAfterAuth(result.user);
  } else {
    errors.value.general = result.error || 'Erreur de connexion';
  }
};

const handleSocialAuth = async (provider) => {
  errors.value = {};
  socialLoadingProvider.value = provider;

  const result = await socialLogin(provider);
  if (result.success && !result.pendingRedirect) {
    goAfterAuth(result.user);
    return;
  }

  if (!result.success && result.error) {
    errors.value.general = result.error;
    socialLoadingProvider.value = '';
  }
};

onMounted(async () => {
  if (!authService.hasPendingSocialAuth()) return;

  socialLoadingProvider.value = localStorage.getItem('social_auth_provider') || 'google';
  const result = await completeSocialLogin();

  if (result.success) {
    goAfterAuth(result.user);
    return;
  }

  if (result.error) {
    errors.value.general = result.error;
  }
  socialLoadingProvider.value = '';
});
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
        <p class="text-gray-600 mb-8">Connectez-vous à votre espace entreprise</p>

        <!-- Error Message -->
        <div v-if="errors.general" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
          {{ errors.general }}
        </div>

        <div class="mb-6">
          <SocialAuthButtons
            mode="login"
            :loading-provider="socialLoadingProvider"
            :disabled="loading"
            @select="handleSocialAuth"
          />
        </div>

        <div class="flex items-center gap-3 mb-6">
          <div class="h-px flex-1 bg-gray-200"></div>
          <span class="text-xs font-semibold text-gray-400">OU</span>
          <div class="h-px flex-1 bg-gray-200"></div>
        </div>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
              Email professionnel
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail :size="20" class="text-gray-400" />
              </div>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="vous@entreprise.com"
                :class="['w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all', errors.email ? 'border-red-500' : 'border-gray-300']"
              />
            </div>
            <p v-if="errors.email" class="text-xs text-red-600 mt-1">{{ errors.email }}</p>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">
              Mot de passe
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock :size="20" class="text-gray-400" />
              </div>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="Votre mot de passe"
                :class="['w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all', errors.password ? 'border-red-500' : 'border-gray-300']"
              />
            </div>
            <p v-if="errors.password" class="text-xs text-red-600 mt-1">{{ errors.password }}</p>
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
          <router-link
            :to="{ path: '/register', query: route.query.redirect ? { redirect: route.query.redirect } : {} }"
            class="text-teal-500 hover:text-teal-600 font-medium transition-colors"
          >
            Creer un compte
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
