<script setup>
import DashboardPreviewCard from './DashboardPreviewCard.vue';
</script>

<template>
  <section id="hero" class="relative min-h-screen flex items-center overflow-hidden">
    <!-- Background Image with Overlay -->
    <div class="absolute inset-0 z-0">
      <img 
        src="/market-background.jpg"
        alt="Vibrant African market scene"
        class="w-full h-full object-cover"
      />
      <div class="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
    </div>

    <!-- Content -->
    <div class="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 pt-32 pb-20 w-full">
      <div class="grid lg:grid-cols-2 gap-16 items-center">
        <!-- Left Column: Hero Text -->
        <div class="text-white space-y-8">
          <!-- Badge -->
          <div class="inline-flex items-center px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full">
            <span class="text-sm font-medium text-white">Solution de paiement moderne</span>
          </div>
          
          <!-- Main Heading -->
          <h1 class="text-6xl lg:text-7xl font-bold leading-tight tracking-tight">
            <span class="block text-white">Gérez vos</span>
            <span class="block text-teal-400">paiements</span>
            <span class="block text-white">échelonnés</span>
            <span class="block text-white">facilement</span>
          </h1>

          <!-- Subtitle -->
          <p class="text-lg lg:text-xl text-white/90 leading-relaxed max-w-xl font-light">
            PayTranche Sénégal vous aide à suivre tous vos paiements clients, gérer les tranches et recevoir des alertes automatiques pour les retards.
          </p>

          <!-- CTA Buttons -->
          <div class="flex flex-col sm:flex-row gap-4 pt-4">
            <button class="px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-all shadow-xl hover:shadow-2xl hover:scale-105">
              Commencer gratuitement
            </button>
            <button class="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold rounded-xl transition-all border border-white/30 hover:border-white/50">
              Voir la démo
            </button>
          </div>
        </div>

        <!-- Right Column: Dashboard Preview Card -->
        <div class="hidden lg:block">
          <!-- <DashboardPreviewCard /> -->
        </div>
      </div>
    </div>
  </section>
</template>