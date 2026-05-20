<script setup>
import { CircleDollarSign, MessageCircle } from 'lucide-vue-next';

const scrollToSection = (sectionId) => {
  document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
};

const openWhatsApp = () => {
  const message = 'Bonjour, je veux en savoir plus sur PayTranche.';
  window.open(`https://wa.me/221781157773?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
};
</script>

<template>
  <footer class="bg-gray-950 text-white">
    <div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
      <div class="grid gap-10 md:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <div class="mb-5 flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-600">
              <CircleDollarSign :size="24" />
            </div>
            <span class="text-2xl font-black">PayTranche</span>
          </div>
          <p class="max-w-md text-white/75">
            Gestion des ventes à crédit, paiements par tranche, liens client et reversements vendeur au Sénégal.
          </p>
        </div>

        <div>
          <h3 class="mb-4 font-black">Produit</h3>
          <ul class="space-y-3 text-white/75">
            <li><button @click="scrollToSection('features')" class="hover:text-white">Fonctionnalités</button></li>
            <li><button @click="scrollToSection('services')" class="hover:text-white">Comment ça marche</button></li>
            <li><button @click="scrollToSection('pricing')" class="hover:text-white">Tarifs</button></li>
            <li><router-link to="/login" class="hover:text-white">Se connecter</router-link></li>
          </ul>
        </div>

        <div>
          <h3 class="mb-4 font-black">Contact</h3>
          <div class="space-y-3 text-white/75">
            <p>+221 781 157 773</p>
            <p>sembenpape4@gmail.com</p>
            <p>Dakar Rufisque, Sénégal</p>
            <button
              type="button"
              @click="openWhatsApp"
              class="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-3 text-sm font-black text-white hover:bg-teal-700"
            >
              <MessageCircle :size="18" />
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      <div class="mt-10 border-t border-white/10 pt-6 text-sm text-white/55">
        © 2026 PayTranche Sénégal. Tous droits réservés.
      </div>
    </div>
  </footer>
</template>
