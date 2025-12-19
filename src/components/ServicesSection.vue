<script setup>
import { UserRound, CircleDollarSign, CalendarCheck, AlertTriangle, BarChart3, Smartphone, Check } from 'lucide-vue-next';

const services = [
  {
    icon: 'user',
    title: 'Gestion des clients',
    description: 'Ajoutez facilement vos clients avec leur nom, prénom, CIN, et coordonnées. Organisez votre base de données clients de manière professionnelle.',
    features: [
      'Fiche client complète',
      'Historique détaillé',
      'Notes personnalisées'
    ]
  },
  {
    icon: 'dollar',
    title: 'Suivi des paiements',
    description: 'Créez des plans de paiement personnalisés avec montant total, montant initial, et tranches. Suivez chaque versement en temps réel.',
    features: [
      'Plans flexibles',
      'Calcul automatique',
      'Statuts en temps réel'
    ]
  },
  {
    icon: 'calendar',
    title: 'Gestion des tranches',
    description: 'Enregistrez chaque versement avec la date et le montant. Le système calcule automatiquement le montant restant et identifie les retards.',
    features: [
      'Calendrier intégré',
      'Rappels automatiques',
      'Historique complet'
    ]
  },
  {
    icon: 'alert',
    title: 'Alertes intelligentes',
    description: 'Recevez des notifications visuelles pour les tranches manquées ou en retard. Ne perdez plus jamais le fil de vos paiements.',
    features: [
      'Notifications push',
      'Indicateurs visuels',
      'Rapports de retard'
    ]
  },
  {
    icon: 'chart',
    title: 'Rapports et statistiques',
    description: 'Visualisez vos performances avec des graphiques clairs. Exportez vos données pour votre comptabilité.',
    features: [
      'Tableaux de bord',
      'Export PDF/Excel',
      'Analyses mensuelles'
    ]
  },
  {
    icon: 'mobile',
    title: 'Accès mobile',
    description: 'Gérez vos paiements depuis votre smartphone ou tablette. Interface responsive adaptée à tous les écrans.',
    features: [
      'Application web',
      'Synchronisation cloud',
      'Hors ligne disponible'
    ]
  }
];

const iconComponents = {
  user: UserRound,
  dollar: CircleDollarSign,
  calendar: CalendarCheck,
  alert: AlertTriangle,
  chart: BarChart3,
  mobile: Smartphone
};
</script>

<template>
  <section id="services" class="bg-gray-50 py-24 relative overflow-hidden">
    <!-- Decorative Background Elements -->
    <div class="absolute top-20 left-10 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
    
    <div class="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
      <!-- Badge -->
      <div class="text-center mb-8">
        <span class="inline-block px-6 py-2.5 bg-teal-50 text-teal-600 rounded-full text-sm font-semibold border border-teal-100">
          Nos Services
        </span>
      </div>

      <!-- Heading -->
      <h2 class="text-4xl md:text-5xl font-bold text-center mb-6 text-gray-900">
        Des fonctionnalités complètes
      </h2>

      <!-- Subtitle -->
      <p class="text-center text-gray-600 text-lg mb-16 max-w-3xl mx-auto">
        Tous les outils dont vous avez besoin pour gérer efficacement vos paiements échelonnés
      </p>

      <!-- Services Grid -->
      <div class="grid md:grid-cols-3 gap-8 mb-16 max-w-6xl mx-auto">
        <div 
          v-for="(service, index) in services" 
          :key="index"
          class="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 group"
        >
          <!-- Icon -->
          <div class="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <component :is="iconComponents[service.icon]" :size="32" :stroke-width="2" class="text-white" />
          </div>

          <!-- Title -->
          <h3 class="text-xl font-bold mb-4 text-gray-900 group-hover:text-teal-600 transition-colors">
            {{ service.title }}
          </h3>

          <!-- Description -->
          <p class="text-gray-600 leading-relaxed mb-6">
            {{ service.description }}
          </p>

          <!-- Features List -->
          <ul class="space-y-3">
            <li 
              v-for="(feature, fIndex) in service.features" 
              :key="fIndex"
              class="flex items-center gap-3 text-gray-700"
            >
              <Check :size="20" :stroke-width="2.5" class="text-teal-500 flex-shrink-0" />
              <span>{{ feature }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- CTA Banner -->
      <div class="bg-gradient-to-r from-teal-500 to-teal-600 rounded-3xl p-12 text-center shadow-2xl">
        <h3 class="text-3xl md:text-4xl font-bold text-white mb-4">
          Prêt à simplifier votre gestion ?
        </h3>
        <p class="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
          Rejoignez des centaines de commerçants qui utilisent déjà PayTranche pour gérer leurs paiements
        </p>
        <button class="px-10 py-4 bg-white text-teal-600 font-bold rounded-full hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl hover:scale-105">
          Essayer gratuitement
        </button>
      </div>
    </div>
  </section>
</template>