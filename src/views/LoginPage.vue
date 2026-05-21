<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { DollarSign } from 'lucide-vue-next';
import { useUser } from '../composables/useUser.js';
import { authService } from '../services/auth.service.js';
import { getPostAuthPath, getSafeRedirectPath } from '../utils/access.js';
import SocialAuthButtons from '../components/SocialAuthButtons.vue';

const router = useRouter();
const route = useRoute();
const { socialLogin, completeSocialLogin, loading } = useUser();

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
        <p class="text-gray-600 mb-8">Connectez-vous avec votre compte habituel</p>

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

        <!-- Sign Up Link -->
        <p class="text-center text-sm text-gray-600">
          Vous n'avez pas de compte ?
          <router-link
            :to="{ path: '/register', query: route.query.redirect ? { redirect: route.query.redirect } : {} }"
            class="text-teal-500 hover:text-teal-600 font-medium transition-colors"
          >
            Créer un compte
          </router-link>
        </p>
      </div>
    </div>
  </div>
</template>
