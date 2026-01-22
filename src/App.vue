<script setup>
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import Navbar from './components/Navbar.vue';
import Footer from './components/Footer.vue';
import PWAInstallPrompt from './components/PWAInstallPrompt.vue';

const route = useRoute();
const showNavAndFooter = computed(() => route.name !== 'Login' && route.name !== 'Register' && route.name !== 'Dashboard' && route.name !== 'Settings' && route.name !== 'PaymentSuccess');
</script>

<template>
  <div class="min-h-screen bg-white">
    <Navbar v-if="showNavAndFooter" />
    <router-view />
    <Footer v-if="showNavAndFooter" />
    <PWAInstallPrompt />
  </div>
</template>