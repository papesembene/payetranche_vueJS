<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { CheckCircle2, Clock, CreditCard, Loader2, Smartphone } from 'lucide-vue-next';
import { clientPortalService } from '../services/clientPortal.service.js';

const route = useRoute();
const portal = ref(null);
const loading = ref(false);
const paying = ref(false);
const error = ref('');

const token = computed(() => route.params.token);
const progress = computed(() => {
  const credit = portal.value?.credit;
  if (!credit?.amount) return 0;
  return Math.min(Math.round((Number(credit.paidAmount || 0) / Number(credit.amount)) * 100), 100);
});
const sellerPaymentAccounts = computed(() => portal.value?.sellerPaymentAccounts || []);

const formatAmount = (amount) => `${new Intl.NumberFormat('fr-FR').format(Number(amount || 0))} FCFA`;

const formatDate = (value) => {
  if (!value) return 'Sans date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Sans date';
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
};

const installmentStatus = (installment) => {
  if (installment.remainingAmount <= 0 || installment.status === 'PAYEE') return 'Payée';
  if (installment.status === 'EN_RETARD') return 'En retard';
  return 'À venir';
};

const paymentMethodLabel = (method) => {
  const labels = {
    WAVE: 'Wave',
    ORANGE_MONEY: 'Orange Money',
    CASH: 'Espèces',
    BANK_TRANSFER: 'Virement',
    OTHER: 'Autre'
  };
  return labels[method] || 'Paiement';
};

const loadPortal = async () => {
  loading.value = true;
  error.value = '';

  try {
    portal.value = await clientPortalService.getPortal(token.value);
  } catch (loadError) {
    error.value = loadError.response?.data?.message || loadError.message || 'Lien de suivi introuvable';
  } finally {
    loading.value = false;
  }
};

const payNext = async () => {
  paying.value = true;
  error.value = '';

  try {
    const request = await clientPortalService.payNext(token.value);
    if (request.redirectUrl) {
      window.location.href = request.redirectUrl;
      return;
    }
    throw new Error('Lien de paiement indisponible');
  } catch (payError) {
    error.value = payError.response?.data?.message || payError.message || 'Paiement impossible';
  } finally {
    paying.value = false;
  }
};

onMounted(loadPortal);
</script>

<template>
  <div class="min-h-screen bg-gray-50 px-3 py-4 sm:px-6">
    <main class="mx-auto max-w-2xl">
      <div class="mb-4 flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-lg bg-teal-600 text-white">
          <CreditCard :size="22" />
        </div>
        <div>
          <p class="text-sm font-black uppercase text-teal-700">PayTranche</p>
          <h1 class="text-xl font-black text-gray-950">Suivi de paiement</h1>
        </div>
      </div>

      <div v-if="loading" class="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm font-semibold text-gray-500">
        Chargement...
      </div>

      <div v-else-if="error && !portal" class="rounded-lg border border-red-200 bg-red-50 p-5 text-center">
        <p class="font-black text-red-700">{{ error }}</p>
      </div>

      <template v-else-if="portal">
        <section class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <p class="text-sm font-bold text-gray-500">{{ portal.sellerName }}</p>
          <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 class="text-xl font-black text-gray-950">{{ portal.clientName }}</h2>
              <p class="text-sm font-semibold text-gray-500">{{ portal.credit.description || 'Vente à crédit' }}</p>
            </div>
            <span
              :class="[
                'inline-flex w-fit rounded-full px-3 py-1 text-xs font-black',
                portal.credit.isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
              ]"
            >
              {{ portal.credit.isPaid ? 'Payée' : 'En cours' }}
            </span>
          </div>

          <div class="mt-5 grid grid-cols-3 gap-2">
            <div class="rounded-lg bg-gray-50 p-3">
              <p class="text-xs font-bold text-gray-500">Dette</p>
              <p class="mt-1 text-sm font-black text-gray-950 sm:text-base">{{ formatAmount(portal.credit.amount) }}</p>
            </div>
            <div class="rounded-lg bg-emerald-50 p-3">
              <p class="text-xs font-bold text-emerald-700">Payé</p>
              <p class="mt-1 text-sm font-black text-gray-950 sm:text-base">{{ formatAmount(portal.credit.paidAmount) }}</p>
            </div>
            <div class="rounded-lg bg-amber-50 p-3">
              <p class="text-xs font-bold text-amber-700">Reste</p>
              <p class="mt-1 text-sm font-black text-gray-950 sm:text-base">{{ formatAmount(portal.credit.remainingAmount) }}</p>
            </div>
          </div>

          <div class="mt-4">
            <div class="flex items-center justify-between text-sm font-bold text-gray-600">
              <span>Progression</span>
              <span>{{ progress }}%</span>
            </div>
            <div class="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
              <div class="h-full rounded-full bg-teal-600" :style="{ width: `${progress}%` }"></div>
            </div>
          </div>

          <button
            v-if="portal.nextPayment?.canPayOnline"
            type="button"
            :disabled="paying"
            @click="payNext"
            class="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 text-base font-black text-white transition-colors hover:bg-teal-700 disabled:bg-gray-300"
          >
            <Loader2 v-if="paying" :size="19" class="animate-spin" />
            <Smartphone v-else :size="19" />
            Payer {{ formatAmount(portal.nextPayment.amount) }}
          </button>

          <div v-else-if="portal.nextPayment" class="mt-5 rounded-lg border border-teal-200 bg-teal-50 p-4">
            <div class="flex items-start gap-3">
              <Smartphone :size="22" class="mt-1 shrink-0 text-teal-700" />
              <div class="min-w-0 flex-1">
                <h3 class="font-black text-teal-950">Payez directement le vendeur</h3>
                <p class="mt-1 text-sm font-semibold text-teal-800">
                  Montant demandé : {{ formatAmount(portal.nextPayment.amount) }}
                </p>
              </div>
            </div>

            <div v-if="sellerPaymentAccounts.length > 0" class="mt-4 grid gap-2">
              <div
                v-for="account in sellerPaymentAccounts"
                :key="`${account.operator}-${account.phone}`"
                class="rounded-lg bg-white p-3 ring-1 ring-teal-100"
              >
                <p class="font-black text-gray-950">{{ account.label }}</p>
                <p class="mt-1 text-lg font-black text-teal-700">{{ account.phone }}</p>
                <p class="text-sm font-semibold text-gray-500">{{ account.holderName }}</p>
              </div>
            </div>
            <p v-else class="mt-4 rounded-lg bg-white p-3 text-sm font-bold text-amber-700 ring-1 ring-amber-100">
              Demandez au vendeur son numéro Wave ou Orange Money.
            </p>

            <p class="mt-3 text-sm font-bold text-teal-900">
              Après paiement, envoyez le reçu au vendeur. Il validera le paiement dans PayTranche.
            </p>
          </div>
          <div v-else class="mt-5 rounded-lg bg-emerald-50 p-4 text-center font-black text-emerald-700">
            Dette totalement soldée
          </div>
        </section>

        <section v-if="portal.installments.length > 0" class="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 class="mb-3 font-black text-gray-950">Tranches</h3>
          <div class="space-y-2">
            <div
              v-for="installment in portal.installments"
              :key="installment.id"
              class="rounded-lg border border-gray-200 p-3"
            >
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="font-black text-gray-950">Tranche {{ installment.number }}</p>
                  <p class="text-sm font-semibold text-gray-500">{{ formatDate(installment.dueDate) }}</p>
                </div>
                <span
                  :class="[
                    'rounded-full px-2.5 py-1 text-xs font-black',
                    installmentStatus(installment) === 'Payée'
                      ? 'bg-emerald-50 text-emerald-700'
                      : installmentStatus(installment) === 'En retard'
                        ? 'bg-red-50 text-red-700'
                        : 'bg-blue-50 text-blue-700'
                  ]"
                >
                  {{ installmentStatus(installment) }}
                </span>
              </div>
              <div class="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div class="rounded-lg bg-gray-50 p-2">
                  <p class="font-bold text-gray-500">Montant</p>
                  <p class="font-black text-gray-950">{{ formatAmount(installment.amount) }}</p>
                </div>
                <div class="rounded-lg bg-gray-50 p-2">
                  <p class="font-bold text-gray-500">Reste</p>
                  <p class="font-black text-gray-950">{{ formatAmount(installment.remainingAmount) }}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section class="mt-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h3 class="mb-3 font-black text-gray-950">Paiements reçus</h3>
          <div v-if="portal.payments.length === 0" class="rounded-lg bg-gray-50 p-4 text-center text-sm font-semibold text-gray-500">
            Aucun paiement confirmé.
          </div>
          <div v-else class="space-y-2">
            <div
              v-for="payment in portal.payments"
              :key="payment.id"
              class="flex items-center justify-between gap-3 rounded-lg border border-gray-200 p-3"
            >
              <div class="flex items-center gap-2">
                <CheckCircle2 :size="18" class="text-emerald-600" />
                <div>
                  <p class="font-black text-gray-950">{{ formatAmount(payment.amount) }}</p>
                  <p class="text-xs font-semibold text-gray-500">
                    {{ paymentMethodLabel(payment.method) }} - {{ formatDate(payment.paidAt) }}
                  </p>
                  <p v-if="payment.reference" class="text-xs font-semibold text-gray-500">
                    {{ payment.reference }}
                  </p>
                </div>
              </div>
              <Clock :size="18" class="text-gray-400" />
            </div>
          </div>
        </section>

        <div v-if="error" class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">
          {{ error }}
        </div>
      </template>
    </main>
  </div>
</template>
