<script setup>
import { ref } from 'vue';
import { Facebook, Twitter, Instagram, ArrowRight, CircleDollarSign } from 'lucide-vue-next';

const newsletterEmail = ref('');

const handleNewsletterSubmit = () => {
  console.log('Newsletter signup:', newsletterEmail.value);
  // Handle newsletter signup
  newsletterEmail.value = '';
};

const scrollToSection = (sectionId) => {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth' });
  }
};
</script>

<template>
  <footer class="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
    <div class="max-w-7xl mx-auto px-6 lg:px-8 py-16">
      <!-- Main Footer Content -->
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
        <!-- Brand Column -->
        <div>
          <div class="flex items-center gap-3 mb-6">
            <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <CircleDollarSign :size="24" :stroke-width="2" class="text-white" />
            </div>
            <span class="text-2xl font-bold">PayTranche</span>
          </div>
          <p class="text-white/90 mb-6 leading-relaxed">
            La solution moderne pour gérer vos paiements échelonnés au Sénégal
          </p>
          <!-- Social Icons -->
          <div class="flex gap-3">
            <a 
              href="#" 
              class="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all hover:scale-110"
              aria-label="Facebook"
            >
              <Facebook :size="20" :stroke-width="2" class="text-white" />
            </a>
            <a 
              href="#" 
              class="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all hover:scale-110"
              aria-label="Twitter"
            >
              <Twitter :size="20" :stroke-width="2" class="text-white" />
            </a>
            <a 
              href="#" 
              class="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all hover:scale-110"
              aria-label="Instagram"
            >
              <Instagram :size="20" :stroke-width="2" class="text-white" />
            </a>
          </div>
        </div>

        <!-- Navigation Column -->
        <div>
          <h3 class="text-lg font-bold mb-6">Navigation</h3>
          <ul class="space-y-3">
            <li>
              <a 
                href="#hero" 
                @click.prevent="scrollToSection('hero')"
                class="text-white/90 hover:text-white transition-colors cursor-pointer"
              >
                Accueil
              </a>
            </li>
            <li>
              <a 
                href="#mission" 
                @click.prevent="scrollToSection('mission')"
                class="text-white/90 hover:text-white transition-colors cursor-pointer"
              >
                À propos
              </a>
            </li>
            <li>
              <a 
                href="#services" 
                @click.prevent="scrollToSection('services')"
                class="text-white/90 hover:text-white transition-colors cursor-pointer"
              >
                Services
              </a>
            </li>
            <li>
              <a 
                href="#features" 
                @click.prevent="scrollToSection('features')"
                class="text-white/90 hover:text-white transition-colors cursor-pointer"
              >
                Portfolio
              </a>
            </li>
            <li>
              <a 
                href="#contact" 
                @click.prevent="scrollToSection('contact')"
                class="text-white/90 hover:text-white transition-colors cursor-pointer"
              >
                Contact
              </a>
            </li>
          </ul>
        </div>

        <!-- Resources Column -->
        <div>
          <h3 class="text-lg font-bold mb-6">Ressources</h3>
          <ul class="space-y-3">
            <li>
              <a href="#" class="text-white/90 hover:text-white transition-colors">
                Documentation
              </a>
            </li>
            <li>
              <a href="#" class="text-white/90 hover:text-white transition-colors">
                Guide d'utilisation
              </a>
            </li>
            <li>
              <a href="#" class="text-white/90 hover:text-white transition-colors">
                FAQ
              </a>
            </li>
            <li>
              <a href="#" class="text-white/90 hover:text-white transition-colors">
                Support
              </a>
            </li>
            <li>
              <a href="#" class="text-white/90 hover:text-white transition-colors">
                Blog
              </a>
            </li>
          </ul>
        </div>

        <!-- Newsletter Column -->
        <div>
          <h3 class="text-lg font-bold mb-6">Restez informé</h3>
          <p class="text-white/90 mb-4 leading-relaxed">
            Inscrivez-vous à notre newsletter pour recevoir les dernières actualités
          </p>
          <form @submit.prevent="handleNewsletterSubmit" class="relative">
            <input
              v-model="newsletterEmail"
              type="email"
              placeholder="Votre email"
              class="w-full px-5 py-3 pr-12 bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl text-white placeholder:text-white/60 focus:outline-none focus:border-white/50 transition-colors"
              required
            />
            <button
              type="submit"
              class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-lg flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="S'inscrire"
            >
              <ArrowRight :size="18" :stroke-width="2.5" class="text-teal-600" />
            </button>
          </form>
        </div>
      </div>

      <!-- Divider -->
      <div class="border-t border-white/20 pt-8">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/80">
          <p>© 2024 PayTranche Sénégal. Tous droits réservés.</p>
          <div class="flex gap-6">
            <a href="#" class="hover:text-white transition-colors">
              Conditions d'utilisation
            </a>
            <a href="#" class="hover:text-white transition-colors">
              Politique de confidentialité
            </a>
            <span class="text-white/60">
              Développé par Sem's - Coding to Success
            </span>
          </div>
        </div>
        <!-- Developer Contact Info -->
        <div class="mt-4 text-center text-xs text-white/60">
          <p>Contact: +221 781 157 773 | Dakar Rufisque | sembenpape4@gmail.com</p>
        </div>
      </div>
    </div>
  </footer>
</template>