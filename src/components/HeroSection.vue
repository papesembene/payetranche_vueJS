<script setup>
import { useRouter } from 'vue-router';
import { ArrowRight, CheckCircle2 } from 'lucide-vue-next';

const router = useRouter();

const goToRegister = () => {
  router.push({ name: 'Register' });
};

const scrollToFeatures = () => {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
};
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
      <div class="max-w-3xl text-white space-y-8">
        <div class="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
          <span class="text-sm font-bold text-white">SaaS pour ventes à crédit au Sénégal</span>
        </div>

        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
          <span class="block text-white">Vendez à crédit</span>
          <span class="block text-teal-300">sans perdre le suivi</span>
        </h1>

        <p class="text-lg lg:text-xl text-white/90 leading-relaxed max-w-2xl font-light">
          PayTranche aide les vendeurs à enregistrer les dettes clients, organiser les paiements par tranche et garder la preuve des paiements reçus.
        </p>

        <div class="grid gap-2 text-sm font-semibold text-white/90 sm:grid-cols-2">
          <span class="inline-flex items-center gap-2"><CheckCircle2 :size="18" class="text-teal-300" /> Tranches et soldes automatiques</span>
          <span class="inline-flex items-center gap-2"><CheckCircle2 :size="18" class="text-teal-300" /> Fiche client sans compte</span>
          <span class="inline-flex items-center gap-2"><CheckCircle2 :size="18" class="text-teal-300" /> Paiement Wave / Orange Money</span>
          <span class="inline-flex items-center gap-2"><CheckCircle2 :size="18" class="text-teal-300" /> Preuves de paiement</span>
        </div>

        <div class="flex flex-col sm:flex-row gap-4 pt-4">
          <button @click="goToRegister" class="inline-flex items-center justify-center gap-2 px-6 py-4 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg transition-colors shadow-xl">
            Commencer gratuitement
            <ArrowRight :size="19" />
          </button>
          <button @click="scrollToFeatures" class="px-6 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold rounded-lg transition-colors border border-white/30">
            Voir comment ça marche
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
