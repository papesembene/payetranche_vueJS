<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { AlertCircle, Loader2 } from 'lucide-vue-next';
import { authService } from '../services/auth.service.js';
import { SessionService } from '../services/session.service.js';
import { useUserStore } from '../stores/user.js';
import { getPostAuthPath } from '../utils/access.js';

const router = useRouter();
const userStore = useUserStore();
const error = ref('');

const readSessionToken = () => {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const callbackError = params.get('error');
  if (callbackError) {
    throw new Error(callbackError);
  }

  const session = params.get('session');
  if (!session) return '';

  const normalized = session.replace(/-/g, '+').replace(/_/g, '/');
  const payload = JSON.parse(window.atob(normalized));
  return payload.token || '';
};

onMounted(async () => {
  try {
    const token = readSessionToken();
    if (!token) {
      throw new Error('Session introuvable.');
    }

    localStorage.setItem('auth_token', token);
    const result = await authService.verifyToken();
    if (!result.valid || !result.user) {
      throw new Error('Connexion impossible.');
    }

    localStorage.setItem('auth_user', JSON.stringify(result.user));
    localStorage.setItem('user_data', JSON.stringify(result.user));
    SessionService.saveSession(result.user);
    authService.clearSocialAuthMemory();
    userStore.user = result.user;
    userStore.isAuthenticated = true;

    router.replace(getPostAuthPath(result.user));
  } catch (callbackError) {
    error.value = callbackError.message || 'Connexion sociale impossible.';
    authService.clearSocialAuthMemory();
    localStorage.removeItem('auth_token');
  }
});
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-50 px-4">
    <div class="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <template v-if="error">
        <AlertCircle class="mx-auto mb-3 text-red-500" :size="34" />
        <h1 class="text-lg font-black text-slate-950">Connexion non terminée</h1>
        <p class="mt-2 text-sm font-semibold text-slate-600">{{ error }}</p>
        <router-link to="/login" class="mt-5 inline-flex rounded-lg bg-teal-600 px-4 py-3 text-sm font-bold text-white">
          Retour connexion
        </router-link>
      </template>
      <template v-else>
        <Loader2 class="mx-auto mb-3 animate-spin text-teal-600" :size="34" />
        <h1 class="text-lg font-black text-slate-950">Connexion en cours</h1>
        <p class="mt-2 text-sm font-semibold text-slate-600">Préparation de votre espace PayTranche...</p>
      </template>
    </div>
  </div>
</template>
