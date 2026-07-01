<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Wallet, Menu, X } from 'lucide-vue-next';

const isScrolled = ref(false);
const isMobileMenuOpen = ref(false);

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50;
};

const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
    isMobileMenuOpen.value = false; // Close menu after navigation
  }
};

const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value;
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>

<template>
  <nav 
    :class="[
      'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
      isScrolled ? 'bg-white/90 backdrop-blur-lg shadow-md' : 'bg-transparent'
    ]"
  >
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center shadow-sm transition-colors',
              isScrolled ? 'bg-teal-500' : 'bg-white'
            ]"
          >
            <Wallet
              :size="22"
              :stroke-width="2.5"
              :class="isScrolled ? 'text-white' : 'text-gray-800'"
            />
          </div>
          <span
            :class="[
              'text-2xl font-bold tracking-tight transition-colors',
              isScrolled ? 'text-gray-900' : 'text-white'
            ]"
          >
            PayTranche
          </span>
        </div>

        <!-- Navigation Links -->
        <div class="hidden md:flex items-center gap-10">
          <a 
            href="#mission" 
            @click.prevent="scrollToSection('mission')"
            :class="[
              'hover:text-teal-500 transition-colors font-medium cursor-pointer',
              isScrolled ? 'text-gray-700' : 'text-white/90 hover:text-white'
            ]"
          >
            À propos
          </a>
          <a 
            href="#services" 
            @click.prevent="scrollToSection('services')"
            :class="[
              'hover:text-teal-500 transition-colors font-medium cursor-pointer',
              isScrolled ? 'text-gray-700' : 'text-white/90 hover:text-white'
            ]"
          >
            Comment ça marche
          </a>
          <a
            href="#use-cases"
            @click.prevent="scrollToSection('use-cases')"
            :class="[
              'hover:text-teal-500 transition-colors font-medium cursor-pointer',
              isScrolled ? 'text-gray-700' : 'text-white/90 hover:text-white'
            ]"
          >
            Cas d’usage
          </a>
          <a
            href="#pricing"
            @click.prevent="scrollToSection('pricing')"
            :class="[
              'hover:text-teal-500 transition-colors font-medium cursor-pointer',
              isScrolled ? 'text-gray-700' : 'text-white/90 hover:text-white'
            ]"
          >
            Tarifs
          </a>
          <a 
            href="#contact" 
            @click.prevent="scrollToSection('contact')"
            :class="[
              'hover:text-teal-500 transition-colors font-medium cursor-pointer',
              isScrolled ? 'text-gray-700' : 'text-white/90 hover:text-white'
            ]"
          >
            Contact
          </a>
        </div>

        <!-- Auth Links & Mobile Menu Button -->
        <div class="flex items-center gap-4">
          <router-link
            to="/register"
            :class="[
              'hidden md:block hover:text-teal-500 transition-colors font-medium',
              isScrolled ? 'text-gray-700' : 'text-white/90 hover:text-white'
            ]"
          >
            S'inscrire
          </router-link>
          <router-link
            to="/login"
            :class="[
              'hidden md:block hover:text-teal-500 transition-colors font-medium',
              isScrolled ? 'text-gray-700' : 'text-white/90 hover:text-white'
            ]"
          >
            Se connecter
          </router-link>
          
          <!-- Mobile Menu Button -->
          <button
            @click="toggleMobileMenu"
            :class="[
              'md:hidden p-2 rounded-lg transition-colors',
              isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-white hover:bg-white/10'
            ]"
            aria-label="Toggle menu"
          >
            <Menu v-if="!isMobileMenuOpen" :size="24" :stroke-width="2" />
            <X v-else :size="24" :stroke-width="2" />
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div
      v-if="isMobileMenuOpen"
      class="md:hidden bg-white border-t border-gray-200 shadow-lg"
    >
      <div class="max-w-7xl mx-auto px-6 py-4 space-y-3">
        <a 
          href="#mission" 
          @click.prevent="scrollToSection('mission')"
          class="block py-3 text-gray-700 hover:text-teal-500 font-medium transition-colors cursor-pointer"
        >
          À propos
        </a>
        <a 
          href="#services" 
          @click.prevent="scrollToSection('services')"
          class="block py-3 text-gray-700 hover:text-teal-500 font-medium transition-colors cursor-pointer"
        >
          Comment ça marche
        </a>
        <a
          href="#use-cases"
          @click.prevent="scrollToSection('use-cases')"
          class="block py-3 text-gray-700 hover:text-teal-500 font-medium transition-colors cursor-pointer"
        >
          Cas d’usage
        </a>
        <a
          href="#pricing"
          @click.prevent="scrollToSection('pricing')"
          class="block py-3 text-gray-700 hover:text-teal-500 font-medium transition-colors cursor-pointer"
        >
          Tarifs
        </a>
        <a 
          href="#contact" 
          @click.prevent="scrollToSection('contact')"
          class="block py-3 text-gray-700 hover:text-teal-500 font-medium transition-colors cursor-pointer"
        >
          Contact
        </a>
        <div class="pt-3 border-t border-gray-200 space-y-3">
          <router-link
            to="/register"
            class="block py-3 text-gray-700 hover:text-teal-500 font-medium transition-colors"
          >
            S'inscrire
          </router-link>
          <router-link
            to="/login"
            class="block py-3 text-gray-700 hover:text-teal-500 font-medium transition-colors"
          >
            Se connecter
          </router-link>
        </div>
      </div>
    </div>
  </nav>
</template>
