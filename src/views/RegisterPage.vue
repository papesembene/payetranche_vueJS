<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Wallet } from 'lucide-vue-next';
import SocialAuthButtons from '../components/SocialAuthButtons.vue';
import { useUser } from '../composables/useUser.js';
import { authService } from '../services/auth.service.js';
import { getPostAuthPath, getSafeRedirectPath } from '../utils/access.js';

const router = useRouter();
const route = useRoute();
const { socialLogin, completeSocialLogin, loading } = useUser();

const errors = ref({});
const socialLoadingProvider = ref('');

const getRedirectPath = () => getSafeRedirectPath(route.query.redirect);

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

  const result = await socialLogin(provider, { usePopup: true });
  if (result.success && !result.pendingRedirect) {
    goAfterAuth(result.user);
    return;
  }

  if (!result.success && result.error) {
    errors.value.general = result.error;
    socialLoadingProvider.value = '';
  }
};

const handleSocialCredential = async ({ provider, idToken }) => {
  errors.value = {};
  socialLoadingProvider.value = provider;

  const result = await socialLogin(provider, { idToken });
  if (result.success) {
    goAfterAuth(result.user);
    return;
  }

  if (result.error) {
    errors.value.general = result.error;
  }
  socialLoadingProvider.value = '';
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
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 px-4 py-6 sm:py-12 overflow-x-hidden">
    <div class="w-full max-w-md">
      <div class="flex justify-center mb-8">
        <div class="bg-white rounded-2xl shadow-lg px-6 py-3 flex items-center gap-3">
          <div class="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
            <Wallet :size="24" :stroke-width="2.5" class="text-white" />
          </div>
          <span class="text-2xl font-bold text-gray-900">PayTranche</span>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-xl p-5 sm:p-8">
        <h1 class="text-2xl font-bold text-gray-900 mb-2">Créer un compte</h1>
        <p class="text-sm text-gray-600 mb-6">
          Inscrivez-vous avec un compte que vous utilisez déjà. Les informations boutique et paiement seront demandées après.
        </p>

        <div v-if="errors.general" class="mb-5 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {{ errors.general }}
        </div>

        <SocialAuthButtons
          mode="register"
          :loading-provider="socialLoadingProvider"
          :disabled="loading"
          @select="handleSocialAuth"
          @credential="handleSocialCredential"
        />

        <div class="mt-5 rounded-xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-800">
          Plan gratuit inclus : jusqu’à 10 clients, sans carte bancaire.
        </div>

        <p class="text-center text-sm text-gray-600 mt-6">
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
</template>
