<script setup>
import { Headphones, Heart, ShieldCheck } from 'lucide-vue-next';

const values = [
  {
    icon: Heart,
    title: 'Pensé pour les vendeurs',
    description: 'Créer une vente à crédit, voir qui doit payer et relancer sans se perdre dans des menus compliqués.'
  },
  {
    icon: ShieldCheck,
    title: 'Données séparées',
    description: 'Chaque entreprise a son espace. Les clients, dettes, paiements et reversements sont isolés par vendeur.'
  },
  {
    icon: Headphones,
    title: 'Prêt à évoluer',
    description: 'La base est prête pour ajouter WhatsApp automatique, SMS ou d’autres moyens de paiement plus tard.'
  }
];
</script>

<template>
  <section id="mission" class="bg-white py-20">
    <div class="mx-auto max-w-6xl px-6 lg:px-8">
      <div class="mx-auto max-w-4xl text-center">
        <span class="inline-block rounded-lg border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-black text-teal-700">
          Pourquoi PayTranche
        </span>
        <h2 class="mt-5 text-3xl font-black leading-tight text-gray-950 sm:text-5xl">
          Remplacer le cahier de dettes par un suivi clair
        </h2>
        <p class="mt-6 text-lg leading-relaxed text-gray-600">
          Beaucoup de vendeurs acceptent les paiements en plusieurs fois, mais suivent encore les montants dans un cahier ou dans WhatsApp. PayTranche centralise la dette, les tranches, les paiements reçus et l’argent à reverser.
        </p>
      </div>

      <div class="mt-12 grid gap-4 md:grid-cols-3">
        <article
          v-for="value in values"
          :key="value.title"
          class="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center"
        >
          <div class="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-teal-600 text-white">
            <component :is="value.icon" :size="25" />
          </div>
          <h3 class="font-black text-gray-950">{{ value.title }}</h3>
          <p class="mt-3 text-sm leading-relaxed text-gray-600">{{ value.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
