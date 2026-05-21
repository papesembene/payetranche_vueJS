<script setup>
import { Store, Sofa, Smartphone, Scissors } from 'lucide-vue-next';

const useCases = [
  {
    icon: Store,
    title: 'Boutiques de quartier',
    text: 'Suivre les clients qui prennent des articles à crédit et payer par petites tranches.'
  },
  {
    icon: Smartphone,
    title: 'Vente d’électronique',
    text: 'Créer une dette pour un téléphone, suivre les tranches et enregistrer le prochain paiement.'
  },
  {
    icon: Sofa,
    title: 'Meubles et équipement',
    text: 'Gérer des montants plus élevés avec plusieurs échéances et un historique clair.'
  },
  {
    icon: Scissors,
    title: 'Salons et services',
    text: 'Noter les avances, le reste à payer et relancer les clients sans oublier les dates.'
  }
];
</script>

<template>
  <section id="use-cases" class="bg-gray-50 py-20">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mb-12 text-center">
        <span class="inline-block rounded-lg border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-black text-teal-700">
          Cas d’usage
        </span>
        <h2 class="mt-5 text-3xl font-black text-gray-950 sm:text-5xl">
          Pour les vendeurs qui acceptent le paiement par tranche
        </h2>
        <p class="mx-auto mt-4 max-w-3xl text-lg text-gray-600">
          PayTranche est utile dès qu’un client repart avec un produit ou service avant d’avoir tout payé.
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <article
          v-for="item in useCases"
          :key="item.title"
          class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div class="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <component :is="item.icon" :size="24" />
          </div>
          <h3 class="font-black text-gray-950">{{ item.title }}</h3>
          <p class="mt-3 text-sm leading-relaxed text-gray-600">{{ item.text }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
