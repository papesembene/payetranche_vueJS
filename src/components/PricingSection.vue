<script setup>
import { useRouter } from 'vue-router';
import { CheckCircle2 } from 'lucide-vue-next';

const router = useRouter();

const plans = [
  {
    name: 'Gratuit',
    price: '0 FCFA',
    description: 'Pour tester avec quelques clients.',
    features: ['Jusqu’à 10 clients actifs', 'Ventes à crédit', 'Tranches', 'Suivi des paiements']
  },
  {
    name: 'Pro',
    price: '3 000 FCFA',
    period: '/ mois',
    description: 'Pour les vendeurs qui utilisent PayTranche au quotidien.',
    highlighted: true,
    features: ['Clients illimités', 'Paiements Wave/Orange Money', 'Relances WhatsApp', 'Preuves de paiement']
  }
];
</script>

<template>
  <section id="pricing" class="bg-white py-20">
    <div class="mx-auto max-w-6xl px-6 lg:px-8">
      <div class="mb-12 text-center">
        <span class="inline-block rounded-lg border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-black text-teal-700">
          Tarifs
        </span>
        <h2 class="mt-5 text-3xl font-black text-gray-950 sm:text-5xl">
          Commencer simple, passer Pro quand ça devient sérieux
        </h2>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <article
          v-for="plan in plans"
          :key="plan.name"
          :class="[
            'rounded-lg border p-6 shadow-sm',
            plan.highlighted ? 'border-teal-300 bg-teal-50' : 'border-gray-200 bg-white'
          ]"
        >
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-2xl font-black text-gray-950">{{ plan.name }}</h3>
              <p class="mt-2 text-gray-600">{{ plan.description }}</p>
            </div>
            <span v-if="plan.highlighted" class="rounded-full bg-teal-600 px-3 py-1 text-xs font-black text-white">
              Recommandé
            </span>
          </div>

          <p class="mt-6 text-4xl font-black text-gray-950">
            {{ plan.price }}
            <span v-if="plan.period" class="text-base font-bold text-gray-500">{{ plan.period }}</span>
          </p>

          <ul class="mt-6 space-y-3">
            <li
              v-for="feature in plan.features"
              :key="feature"
              class="flex items-center gap-3 text-sm font-semibold text-gray-700"
            >
              <CheckCircle2 :size="19" class="text-teal-600" />
              {{ feature }}
            </li>
          </ul>

          <button
            type="button"
            @click="router.push('/register')"
            :class="[
              'mt-8 min-h-12 w-full rounded-lg px-4 text-sm font-black transition-colors',
              plan.highlighted ? 'bg-teal-600 text-white hover:bg-teal-700' : 'border border-gray-300 text-gray-800 hover:bg-gray-50'
            ]"
          >
            Créer un compte
          </button>
        </article>
      </div>
    </div>
  </section>
</template>
