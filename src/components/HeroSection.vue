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
      <div class="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-center">
        <!-- Left Column: Hero Text -->
        <div class="text-white space-y-8">
          <!-- Badge -->
          <div class="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg">
            <span class="text-sm font-bold text-white">SaaS pour ventes à crédit au Sénégal</span>
          </div>
          
          <!-- Main Heading -->
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
            <span class="block text-white">Vendez à crédit</span>
            <span class="block text-teal-300">sans perdre le suivi</span>
          </h1>

          <!-- Subtitle -->
          <p class="text-lg lg:text-xl text-white/90 leading-relaxed max-w-xl font-light">
            PayTranche aide les vendeurs à enregistrer les dettes clients, découper les paiements en tranches, envoyer un lien de suivi au client et encaisser via Mobile Money avec PayTech.
          </p>

          <div class="grid gap-2 text-sm font-semibold text-white/90 sm:grid-cols-2">
            <span class="inline-flex items-center gap-2"><CheckCircle2 :size="18" class="text-teal-300" /> Tranches et soldes automatiques</span>
            <span class="inline-flex items-center gap-2"><CheckCircle2 :size="18" class="text-teal-300" /> Lien client sans compte</span>
            <span class="inline-flex items-center gap-2"><CheckCircle2 :size="18" class="text-teal-300" /> Paiement Wave / Orange Money</span>
            <span class="inline-flex items-center gap-2"><CheckCircle2 :size="18" class="text-teal-300" /> Reversements vendeur suivis</span>
          </div>

          <!-- CTA Buttons -->
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

        <div class="hidden lg:block rounded-lg border border-white/20 bg-white/10 p-5 backdrop-blur-md">
          <div class="rounded-lg bg-white p-5 shadow-2xl">
            <div class="mb-4 flex items-center justify-between">
              <div>
                <p class="text-xs font-black uppercase text-teal-700">Dette client</p>
                <h3 class="text-xl font-black text-gray-950">Moussa Diop</h3>
              </div>
              <span class="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">En cours</span>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <div class="rounded-lg bg-gray-50 p-3">
                <p class="text-xs font-bold text-gray-500">Dette</p>
                <p class="font-black text-gray-950">30 000</p>
              </div>
              <div class="rounded-lg bg-emerald-50 p-3">
                <p class="text-xs font-bold text-emerald-700">Payé</p>
                <p class="font-black text-gray-950">10 000</p>
              </div>
              <div class="rounded-lg bg-amber-50 p-3">
                <p class="text-xs font-bold text-amber-700">Reste</p>
                <p class="font-black text-gray-950">20 000</p>
              </div>
            </div>
            <div class="mt-4 space-y-2">
              <div class="rounded-lg border border-gray-200 p-3">
                <p class="font-bold text-gray-950">Tranche 2</p>
                <p class="text-sm text-gray-500">10 000 FCFA · 30 mai 2026</p>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div class="rounded-lg bg-teal-600 p-3 text-center text-sm font-black text-white">Payer</div>
                <div class="rounded-lg border border-teal-200 p-3 text-center text-sm font-black text-teal-700">Lien suivi</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
