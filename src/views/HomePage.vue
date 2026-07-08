<script setup>
import { useRouter } from 'vue-router';
import { ArrowRight, Check, CreditCard, Smartphone, Wallet } from 'lucide-vue-next';

const router = useRouter();

const goToRegister = () => {
  router.push({ name: 'Register' });
};

const steps = [
  'Créer une vente à crédit',
  'Choisir les tranches',
  'Noter chaque paiement reçu'
];
</script>

<template>
  <main class="bg-white">
    <section class="relative min-h-screen overflow-hidden">
      <img
        src="/market-background.jpg"
        alt="Marché au Sénégal"
        class="absolute inset-0 h-full w-full object-cover"
      />
      <div class="absolute inset-0 bg-black/65"></div>

      <div class="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-5 pb-10 pt-28 text-white sm:px-8 sm:pt-24">
        <div class="max-w-2xl">
          <p class="mb-4 inline-flex rounded-full bg-white/12 px-4 py-2 text-sm font-bold text-teal-100 ring-1 ring-white/20">
            Carnet de crédit simple pour vendeurs
          </p>

          <h1 class="text-4xl font-black leading-tight sm:text-6xl">
            PayTranche
          </h1>

          <p class="mt-5 text-lg font-semibold leading-8 text-white/90 sm:text-xl">
            Gardez les dettes clients, les tranches et les paiements reçus au même endroit.
          </p>

          <div class="mt-7 grid gap-3 text-sm font-bold text-white/95 sm:grid-cols-3">
            <span class="inline-flex items-center gap-2">
              <CreditCard :size="18" class="text-teal-300" />
              Dettes
            </span>
            <span class="inline-flex items-center gap-2">
              <Smartphone :size="18" class="text-teal-300" />
              Wave / Orange Money
            </span>
            <span class="inline-flex items-center gap-2">
              <Wallet :size="18" class="text-teal-300" />
              Solde automatique
            </span>
          </div>

          <button
            class="mt-9 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-teal-500 px-6 py-4 text-base font-black text-white shadow-xl transition-colors hover:bg-teal-600 sm:w-auto"
            @click="goToRegister"
          >
            Commencer
            <ArrowRight :size="19" />
          </button>
        </div>
      </div>
    </section>

    <section class="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <div class="grid gap-3 sm:grid-cols-3">
        <div
          v-for="(step, index) in steps"
          :key="step"
          class="rounded-lg border border-slate-200 bg-white p-5"
        >
          <div class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <Check :size="20" />
          </div>
          <p class="text-sm font-black text-slate-400">Étape {{ index + 1 }}</p>
          <h2 class="mt-1 text-lg font-black text-slate-950">{{ step }}</h2>
        </div>
      </div>
    </section>

    <section class="border-t border-slate-100 bg-slate-50">
      <div class="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <h2 class="text-2xl font-black text-slate-950">Gratuit pour démarrer</h2>
          <p class="mt-1 text-sm font-semibold text-slate-600">Jusqu’à 10 clients. Le plan Pro est à 3 000 FCFA/mois.</p>
        </div>
        <button
          class="inline-flex items-center justify-center rounded-lg bg-slate-950 px-5 py-3 text-sm font-black text-white"
          @click="goToRegister"
        >
          Créer mon compte
        </button>
      </div>
    </section>
  </main>
</template>
