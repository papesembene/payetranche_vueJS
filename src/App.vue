<script setup>
import { useRoute } from 'vue-router';
import { computed, onMounted } from 'vue';
import Navbar from './components/Navbar.vue';
import Footer from './components/Footer.vue';
import PWAInstallPrompt from './components/PWAInstallPrompt.vue';
import AppUpdateWatcher from './components/AppUpdateWatcher.vue';
import { useUser } from './composables/useUser.js';

const route = useRoute();
const { initAuth } = useUser();
const showNavAndFooter = computed(() => !['Login', 'Register', 'SocialCallback', 'Onboarding', 'Dashboard', 'Settings', 'Admin', 'PaymentSuccess'].includes(route.name));

// Initialiser l'authentification au montage de l'app
onMounted(async () => {
  await initAuth();
});
</script>

<template>
  <div class="min-h-screen bg-white">
    <Navbar v-if="showNavAndFooter" />
    <router-view />
    <Footer v-if="showNavAndFooter" />
    <AppUpdateWatcher />
    <PWAInstallPrompt />
  </div>
</template>
