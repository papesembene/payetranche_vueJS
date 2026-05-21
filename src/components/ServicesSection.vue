<script setup>
import { CalendarCheck, Check, Link2, MessageCircle, Smartphone, UserRound, WalletCards } from 'lucide-vue-next';

const steps = [
  {
    icon: UserRound,
    title: '1. Créer la vente',
    description: 'Le vendeur ajoute le client, le montant de la vente à crédit et l’acompte si le client a déjà payé une partie.'
  },
  {
    icon: CalendarCheck,
    title: '2. Découper en tranches',
    description: 'PayTranche calcule les tranches, les dates d’échéance et le solde restant automatiquement.'
  },
  {
    icon: Link2,
    title: '3. Partager la fiche client',
    description: 'Le client garde une fiche de suivi pour consulter sa dette, ses tranches et les numéros du vendeur.'
  },
  {
    icon: Smartphone,
    title: '4. Recevoir le paiement',
    description: 'Le client paie directement le vendeur par Wave, Orange Money ou espèces.'
  },
  {
    icon: MessageCircle,
    title: '5. Relancer simplement',
    description: 'Le vendeur voit les échéances à relancer et envoie un message WhatsApp préparé.'
  },
  {
    icon: WalletCards,
    title: '6. Garder la preuve',
    description: 'Le vendeur note la référence du reçu Wave ou Orange Money dans l’historique.'
  }
];
</script>

<template>
  <section id="services" class="bg-white py-20">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mb-12 text-center">
        <span class="inline-block rounded-lg border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-black text-teal-700">
          Comment ça marche
        </span>
        <h2 class="mt-5 text-3xl font-black text-gray-950 sm:text-5xl">
          Un parcours simple du vendeur au client
        </h2>
        <p class="mx-auto mt-4 max-w-3xl text-lg text-gray-600">
          PayTranche évite au vendeur de refaire les calculs à la main et donne au client une fiche claire à consulter.
        </p>
      </div>

      <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <article
          v-for="step in steps"
          :key="step.title"
          class="rounded-lg border border-gray-200 bg-gray-50 p-6"
        >
          <div class="mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-white text-teal-600 shadow-sm">
            <component :is="step.icon" :size="24" />
          </div>
          <h3 class="text-lg font-black text-gray-950">{{ step.title }}</h3>
          <p class="mt-3 text-gray-600">{{ step.description }}</p>
        </article>
      </div>

      <div class="mt-12 rounded-lg bg-teal-600 p-6 text-white sm:p-8">
        <div class="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <h3 class="text-2xl font-black">Le client ne crée pas de compte.</h3>
            <p class="mt-2 text-white/90">
              Il ouvre sa fiche de suivi, voit ce qu’il reste à payer et envoie l’argent directement au vendeur.
            </p>
          </div>
          <div class="grid gap-2 text-sm font-bold sm:grid-cols-3 lg:min-w-[520px]">
            <span class="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2"><Check :size="17" /> Solde clair</span>
            <span class="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2"><Check :size="17" /> Tranches visibles</span>
            <span class="inline-flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2"><Check :size="17" /> Numéros Wave/OM</span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
