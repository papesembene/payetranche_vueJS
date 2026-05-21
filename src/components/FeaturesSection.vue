<script setup>
import {
  Bell,
  CreditCard,
  Link2,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  WalletCards
} from 'lucide-vue-next';

const mainFeatures = [
  {
    icon: CreditCard,
    title: 'Ventes à crédit',
    description: 'Le vendeur enregistre une dette client avec montant, acompte, échéance et statut.'
  },
  {
    icon: Link2,
    title: 'Lien de suivi client',
    description: 'Le client reçoit un lien permanent pour voir son solde, ses tranches et les numéros du vendeur.'
  },
  {
    icon: Smartphone,
    title: 'Paiement direct',
    description: 'Le client paie directement le vendeur par Wave, Orange Money ou espèces.'
  },
  {
    icon: WalletCards,
    title: 'Preuves de paiement',
    description: 'Le vendeur enregistre le moyen de paiement et la référence du reçu.'
  }
];

const secondaryFeatures = [
  {
    icon: Bell,
    title: 'Relances WhatsApp',
    description: 'Liste des clients à relancer et messages prêts à envoyer sur WhatsApp.'
  },
  {
    icon: ShieldCheck,
    title: 'Séparation par entreprise',
    description: 'Chaque vendeur voit uniquement ses clients, ses dettes et ses paiements.'
  },
  {
    icon: MessageCircle,
    title: 'Simple pour le terrain',
    description: 'Une interface pensée mobile pour créer une vente, encaisser et relancer rapidement.'
  }
];
</script>

<template>
  <section id="features" class="bg-gray-50 py-20">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mb-12 max-w-3xl">
        <span class="inline-block rounded-lg border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-black text-teal-700">
          Fonctionnalités réelles
        </span>
        <h2 class="mt-5 text-3xl font-black text-gray-950 sm:text-5xl">
          Ce que PayTranche fait aujourd’hui
        </h2>
        <p class="mt-4 text-lg text-gray-600">
          Un outil simple pour les boutiques, salons, vendeurs d’électronique ou meubles qui acceptent les paiements par tranche.
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <article
          v-for="feature in mainFeatures"
          :key="feature.title"
          class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
        >
          <div class="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-teal-600 text-white">
            <component :is="feature.icon" :size="25" />
          </div>
          <h3 class="text-xl font-black text-gray-950">{{ feature.title }}</h3>
          <p class="mt-3 text-gray-600">{{ feature.description }}</p>
        </article>
      </div>

      <div class="mt-4 grid gap-4 md:grid-cols-3">
        <article
          v-for="feature in secondaryFeatures"
          :key="feature.title"
          class="rounded-lg border border-gray-200 bg-white p-5"
        >
          <component :is="feature.icon" :size="24" class="text-teal-600" />
          <h3 class="mt-4 font-black text-gray-950">{{ feature.title }}</h3>
          <p class="mt-2 text-sm text-gray-600">{{ feature.description }}</p>
        </article>
      </div>
    </div>
  </section>
</template>
