<script setup>
import { Heart, ShieldCheck, Headphones, PenLine, TrendingUp } from 'lucide-vue-next';


const iconComponents = {
  heart: Heart,
  shield: ShieldCheck,
  headphones: Headphones
};
</script>

<template>
  <section id="mission" class="bg-gradient-to-b from-white via-gray-50 to-white py-24 relative overflow-hidden">
    <!-- Decorative Background Elements -->
    <div class="absolute top-20 left-10 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
    
    <div class="max-w-6xl mx-auto px-6 lg:px-8 relative z-10">
      <!-- Mission Badge -->
      <div class="text-center mb-10">
        <span class="inline-block px-6 py-2.5 bg-teal-50 text-teal-600 rounded-full text-sm font-semibold border border-teal-100">
          Notre Mission
        </span>
      </div>

      <!-- Heading -->
      <h2 class="text-5xl md:text-6xl font-bold text-center mb-12 leading-tight">
        <span class="text-gray-900">Simplifier le suivi des</span>
        <br />
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-blue-600">paiements</span>
        <span class="text-gray-900"> pour la</span>
        <br />
        <span class="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-teal-500">croissance</span>
      </h2>

      <!-- Description -->
      <div class="max-w-4xl mx-auto text-center space-y-6 mb-16">
        <p class="text-lg text-gray-600 leading-relaxed">
          PayTranche Sénégal est né d'un constat simple : de nombreux commerçants et entrepreneurs sénégalais perdent du temps et de l'argent à cause d'une gestion manuelle des paiements échelonnés.
        </p>
        <p class="text-lg text-gray-600 leading-relaxed">
          Notre solution digitale vous permet de suivre facilement tous vos clients, leurs paiements, et de recevoir des alertes automatiques pour les retards. Plus besoin de cahiers ou de fichiers Excel compliqués.
        </p>
        <p class="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">
          Nous croyons que chaque entrepreneur mérite des outils modernes et accessibles pour développer son activité.
        </p>
      </div>

      <!-- Statistics -->
      <div class="grid md:grid-cols-3 gap-12 mb-20 max-w-5xl mx-auto">
        <div 
          v-for="(stat, index) in statistics" 
          :key="index"
          class="text-center group"
        >
          <div class="relative inline-block">
            <div class="absolute inset-0 bg-gradient-to-r from-teal-400 to-teal-600 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <p class="relative text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-teal-700 mb-3">
              {{ stat.value }}
            </p>
          </div>
          <p class="text-gray-600 text-base font-medium">{{ stat.label }}</p>
        </div>
      </div>

      <!-- Feature Cards -->
      <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div 
          v-for="(feature, index) in features" 
          :key="index"
          class="bg-white rounded-2xl p-8 text-center hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 group"
        >
          <div class="relative w-20 h-20 mx-auto mb-6">
            <div class="absolute inset-0 bg-gradient-to-br from-teal-400 to-teal-600 rounded-2xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
            <div class="relative w-20 h-20 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
              <component :is="iconComponents[feature.icon]" :size="32" :stroke-width="2" class="text-white" />
            </div>
          </div>
          <h3 class="text-xl font-bold text-gray-900 mb-3 group-hover:text-teal-600 transition-colors">
            {{ feature.title }}
          </h3>
          <p class="text-gray-600 leading-relaxed">{{ feature.description }}</p>
        </div>
      </div>
    </div>
  </section>
</template>