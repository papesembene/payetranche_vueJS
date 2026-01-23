<script setup>
import { useRoute } from 'vue-router';
import { computed, onMounted } from 'vue';
import Navbar from './components/Navbar.vue';
import Footer from './components/Footer.vue';
import PWAInstallPrompt from './components/PWAInstallPrompt.vue';
import { useUser } from './composables/useUser.js';

const route = useRoute();
const { initAuth } = useUser();
const showNavAndFooter = computed(() => route.name !== 'Login' && route.name !== 'Register' && route.name !== 'Dashboard' && route.name !== 'Settings' && route.name !== 'PaymentSuccess');

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
    <PWAInstallPrompt />
  </div>
</template>