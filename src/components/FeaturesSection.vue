<script setup>
import { LayoutGrid, Bell, TrendingUp, Smartphone, ShieldCheck, Globe, FileText, ArrowRight } from 'lucide-vue-next';
</script>

<template>
  <section id="features" class="bg-gray-50 py-24 relative overflow-hidden">
    <!-- Decorative Background Elements -->
    <div class="absolute top-20 right-10 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-20 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
    
    <div class="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
      <!-- Badge -->
      <div class="text-center mb-8">
        <span class="inline-block px-6 py-2.5 bg-teal-50 text-teal-600 rounded-full text-sm font-semibold border border-teal-100">
          Fonctionnalités
        </span>
      </div>

      <!-- Heading -->
      <h2 class="text-4xl md:text-5xl font-bold text-center mb-6 text-gray-900">
        Tout ce dont vous avez besoin
      </h2>

      <!-- Subtitle -->
      <p class="text-center text-gray-600 text-lg mb-16 max-w-3xl mx-auto">
        Des outils puissants et simples pour gérer efficacement vos paiements échelonnés
      </p>

      <!-- Main Feature Cards Grid -->
      <div class="grid md:grid-cols-2 gap-8 mb-16 max-w-6xl mx-auto">
        <!-- Card 1: Tableau de bord intuitif -->
        <div class="bg-gradient-to-br from-teal-500 to-teal-600 rounded-3xl p-10 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 group">
          <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <LayoutGrid :size="32" :stroke-width="2" class="text-white" />
          </div>
          <h3 class="text-2xl font-bold mb-4">Tableau de bord intuitif</h3>
          <p class="text-white/90 mb-6 leading-relaxed">
            Visualisez tous vos clients, montants et statuts de paiement en un coup d'œil
          </p>
          <a href="#" class="inline-flex items-center gap-2 text-white font-semibold hover:gap-3 transition-all group/link">
            En savoir plus
            <ArrowRight :size="20" :stroke-width="2" class="group-hover/link:translate-x-1 transition-transform" />
          </a>
        </div>

        <!-- Card 2: Alertes automatiques -->
        <div class="bg-gradient-to-br from-red-400 to-red-500 rounded-3xl p-10 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 group">
          <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Bell :size="32" :stroke-width="2" class="text-white" />
          </div>
          <h3 class="text-2xl font-bold mb-4">Alertes automatiques</h3>
          <p class="text-white/90 mb-6 leading-relaxed">
            Recevez des notifications pour les tranches manquées ou retardées
          </p>
          <a href="#" class="inline-flex items-center gap-2 text-white font-semibold hover:gap-3 transition-all group/link">
            En savoir plus
            <ArrowRight :size="20" :stroke-width="2" class="group-hover/link:translate-x-1 transition-transform" />
          </a>
        </div>

        <!-- Card 3: Suivi détaillé -->
        <div class="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-3xl p-10 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 group">
          <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <TrendingUp :size="32" :stroke-width="2" class="text-white" />
          </div>
          <h3 class="text-2xl font-bold mb-4">Suivi détaillé</h3>
          <p class="text-white/90 mb-6 leading-relaxed">
            Historique complet des versements pour chaque client avec dates et montants
          </p>
          <a href="#" class="inline-flex items-center gap-2 text-white font-semibold hover:gap-3 transition-all group/link">
            En savoir plus
            <ArrowRight :size="20" :stroke-width="2" class="group-hover/link:translate-x-1 transition-transform" />
          </a>
        </div>

        <!-- Card 4: Interface mobile -->
        <div class="bg-gradient-to-br from-orange-400 to-orange-500 rounded-3xl p-10 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 hover:-translate-y-1 group">
          <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Smartphone :size="32" :stroke-width="2" class="text-white" />
          </div>
          <h3 class="text-2xl font-bold mb-4">Interface mobile</h3>
          <p class="text-white/90 mb-6 leading-relaxed">
            Gérez vos paiements depuis votre téléphone, n'importe où, n'importe quand
          </p>
          <a href="#" class="inline-flex items-center gap-2 text-white font-semibold hover:gap-3 transition-all group/link">
            En savoir plus
            <ArrowRight :size="20" :stroke-width="2" class="group-hover/link:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>

      <!-- Bottom Feature Items -->
      <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <!-- Sécurisé -->
        <div class="text-center group">
          <div class="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-teal-100 transition-colors">
            <ShieldCheck :size="32" :stroke-width="2" class="text-teal-600" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">Sécurisé</h3>
          <p class="text-gray-600 leading-relaxed">
            Vos données sont protégées et cryptées
          </p>
        </div>

        <!-- Multi-devises -->
        <div class="text-center group">
          <div class="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-teal-100 transition-colors">
            <Globe :size="32" :stroke-width="2" class="text-teal-600" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">Multi-devises</h3>
          <p class="text-gray-600 leading-relaxed">
            Support FCFA et autres devises
          </p>
        </div>

        <!-- Rapports détaillés -->
        <div class="text-center group">
          <div class="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-teal-100 transition-colors">
            <FileText :size="32" :stroke-width="2" class="text-teal-600" />
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3">Rapports détaillés</h3>
          <p class="text-gray-600 leading-relaxed">
            Exportez vos données en PDF ou Excel
          </p>
        </div>
      </div>
    </div>
  </section>
</template>