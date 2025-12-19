<script setup>
import { Star, MapPin } from 'lucide-vue-next';

const testimonials = [
  {
    name: 'Amadou Diallo',
    title: 'Propriétaire de boutique',
    location: 'Dakar',
    avatar: 'https://i.pravatar.cc/150?u=amadou-diallo',
    rating: 5,
    text: 'PayTranche a transformé ma façon de gérer les paiements. Je ne perds plus de temps avec mes cahiers et je sais toujours qui doit payer.'
  },
  {
    name: 'Fatou Sall',
    title: 'Commerçante de tissus',
    location: 'Thiès',
    avatar: 'https://i.pravatar.cc/150?u=fatou-sall',
    rating: 5,
    text: 'Les alertes automatiques sont géniales ! Je reçois une notification quand un client est en retard. Cela m\'aide beaucoup à suivre mes ventes.'
  },
  {
    name: 'Moussa Kane',
    title: 'Vendeur d\'électronique',
    location: 'Saint-Louis',
    avatar: 'https://i.pravatar.cc/150?u=moussa-kane',
    rating: 5,
    text: 'Interface très simple à utiliser. Même sans être un expert en technologie, j\'ai pu commencer à l\'utiliser immédiatement.'
  },
  {
    name: 'Aïssatou Ndiaye',
    title: 'Gérante de salon',
    location: 'Dakar',
    avatar: 'https://i.pravatar.cc/150?u=aissatou-ndiaye',
    rating: 5,
    text: 'Mes clientes peuvent payer en plusieurs fois et je garde une trace de tout. C\'est exactement ce dont j\'avais besoin pour mon salon.'
  },
  {
    name: 'Ibrahima Sarr',
    title: 'Marchand de meubles',
    location: 'Kaolack',
    avatar: 'https://i.pravatar.cc/150?u=ibrahima-sarr',
    rating: 5,
    text: 'Depuis que j\'utilise PayTranche, j\'ai réduit mes impayés de moitié. Les rappels automatiques font vraiment la différence.'
  }
];
</script>

<template>
  <section id="testimonials" class="bg-gray-50 py-24 relative overflow-hidden">
    <!-- Decorative Background Elements -->
    <div class="absolute top-20 right-10 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-20 left-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
    
    <div class="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
      <!-- Badge -->
      <div class="text-center mb-8">
        <span class="inline-block px-6 py-2.5 bg-teal-50 text-teal-600 rounded-full text-sm font-semibold border border-teal-100">
          Témoignages
        </span>
      </div>

      <!-- Heading -->
      <h2 class="text-4xl md:text-5xl font-bold text-center mb-6 text-gray-900">
        Ce que disent nos clients
      </h2>

      <!-- Subtitle -->
      <p class="text-center text-gray-600 text-lg mb-16 max-w-3xl mx-auto">
        Des centaines de commerçants sénégalais nous font confiance pour gérer leurs paiements
      </p>

      <!-- Testimonials Grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div 
          v-for="(testimonial, index) in testimonials" 
          :key="index"
          class="bg-white rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border border-gray-100 relative"
        >
          <!-- Decorative Quote Mark -->
          <div class="absolute top-6 right-6 text-gray-100 text-6xl font-serif leading-none">"</div>
          
          <!-- Profile Section -->
          <div class="flex items-start gap-4 mb-6 relative z-10">
            <!-- Avatar -->
            <img 
              :src="testimonial.avatar" 
              :alt="testimonial.name"
              class="w-16 h-16 rounded-full object-cover border-2 border-teal-100"
            />
            
            <!-- Info -->
            <div class="flex-1">
              <h3 class="text-lg font-bold text-gray-900 mb-1">
                {{ testimonial.name }}
              </h3>
              <p class="text-sm text-gray-600 mb-1">
                {{ testimonial.title }}
              </p>
              <div class="flex items-center gap-1 text-teal-600 text-sm">
                <MapPin :size="14" :stroke-width="2" />
                <span>{{ testimonial.location }}</span>
              </div>
            </div>
          </div>

          <!-- Rating -->
          <div class="flex gap-1 mb-4">
            <Star 
              v-for="star in testimonial.rating" 
              :key="star"
              :size="20" 
              :stroke-width="0"
              class="text-yellow-400 fill-yellow-400"
            />
          </div>

          <!-- Testimonial Text -->
          <p class="text-gray-700 leading-relaxed italic">
            "{{ testimonial.text }}"
          </p>
        </div>
      </div>
    </div>
  </section>
</template>