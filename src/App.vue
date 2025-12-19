<script setup>
import { useRoute } from 'vue-router';
import { computed } from 'vue';
import Navbar from './components/Navbar.vue';
import Footer from './components/Footer.vue';

const route = useRoute();
const showNavAndFooter = computed(() => route.name !== 'Login' && route.name !== 'Dashboard');
</script>

<template>
  <div class="min-h-screen bg-white">
    <Navbar v-if="showNavAndFooter" />
    <router-view />
    <Footer v-if="showNavAndFooter" />
  </div>
</template>