<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { CheckCircle, Phone, Store, Wallet } from 'lucide-vue-next';
import { onboardingService } from '../services/onboarding.service.js';
import { useUserStore } from '../stores/user.js';
import MobileMoneyIcon from '../components/dashboard/MobileMoneyIcon.vue';
import { getUserFriendlyError } from '../utils/userFriendlyError.js';

const router = useRouter();
const userStore = useUserStore();
const loading = ref(false);
const saving = ref(false);
const errors = ref({});
const currentUser = ref(JSON.parse(localStorage.getItem('auth_user') || '{}'));

const form = ref({
  companyName: '',
  phone: '',
  holderName: '',
  wavePhone: '',
  orangeMoneyPhone: '',
  preferredOperator: 'WAVE'
});

const hasWave = computed(() => form.value.wavePhone.trim().length > 0);
const hasOrangeMoney = computed(() => form.value.orangeMoneyPhone.trim().length > 0);
const displayUserContact = computed(() => {
  const email = currentUser.value?.email || '';
  return email.endsWith('@auth.paytranche.local') || email.endsWith('@paytranche.local')
    ? 'Compte social PayTranche'
    : email;
});

const cleanPhone = (value = '') => value.replace(/\s+/g, '').replace(/^\+221/, '').replace(/^221/, '');

const getPostOnboardingRedirect = () => {
  const redirect = localStorage.getItem('post_onboarding_redirect') || '';
  localStorage.removeItem('post_onboarding_redirect');

  if (!redirect.startsWith('/') || redirect.startsWith('//')) return '/dashboard';
  if (['/login', '/register', '/onboarding'].includes(redirect)) return '/dashboard';
  return redirect;
};

const validatePhone = (value) => {
  const cleaned = cleanPhone(value);
  return cleaned.length >= 8;
};

const loadStatus = async () => {
  loading.value = true;
  try {
    const status = await onboardingService.getStatus();
    currentUser.value = status.user || currentUser.value;
    const defaultPayout = status.payoutProfiles?.find((item) => item.isDefault) || status.payoutProfiles?.[0];
    const wave = status.payoutProfiles?.find((item) => item.operator === 'WAVE');
    const orange = status.payoutProfiles?.find((item) => item.operator === 'ORANGE_MONEY');

    form.value.companyName = status.tenant?.name || '';
    form.value.phone = status.user?.phone || '';
    form.value.holderName = defaultPayout?.holderName || status.user?.name || '';
    form.value.wavePhone = wave?.phone || '';
    form.value.orangeMoneyPhone = orange?.phone || '';
    form.value.preferredOperator = defaultPayout?.operator || 'WAVE';

    if (status.isComplete) {
      router.replace(getPostOnboardingRedirect());
    }
  } catch (error) {
    errors.value.general = getUserFriendlyError(error, 'load');
  } finally {
    loading.value = false;
  }
};

const validate = () => {
  const nextErrors = {};
  if (!form.value.companyName.trim()) nextErrors.companyName = 'Nom boutique requis';
  if (!validatePhone(form.value.phone)) nextErrors.phone = 'Téléphone vendeur requis';
  if (!form.value.holderName.trim()) nextErrors.holderName = 'Nom titulaire requis';
  if (!hasWave.value && !hasOrangeMoney.value) nextErrors.payout = 'Ajoutez Wave ou Orange Money';
  if (hasWave.value && !validatePhone(form.value.wavePhone)) nextErrors.wavePhone = 'Numéro Wave invalide';
  if (hasOrangeMoney.value && !validatePhone(form.value.orangeMoneyPhone)) nextErrors.orangeMoneyPhone = 'Numéro Orange Money invalide';

  if (form.value.preferredOperator === 'WAVE' && !hasWave.value && hasOrangeMoney.value) {
    form.value.preferredOperator = 'ORANGE_MONEY';
  }
  if (form.value.preferredOperator === 'ORANGE_MONEY' && !hasOrangeMoney.value && hasWave.value) {
    form.value.preferredOperator = 'WAVE';
  }

  errors.value = nextErrors;
  return Object.keys(nextErrors).length === 0;
};

const submit = async () => {
  if (!validate()) return;

  const payoutAccounts = [];
  if (hasWave.value) {
    payoutAccounts.push({
      operator: 'WAVE',
      phone: cleanPhone(form.value.wavePhone),
      holderName: form.value.holderName.trim(),
      isDefault: form.value.preferredOperator === 'WAVE'
    });
  }
  if (hasOrangeMoney.value) {
    payoutAccounts.push({
      operator: 'ORANGE_MONEY',
      phone: cleanPhone(form.value.orangeMoneyPhone),
      holderName: form.value.holderName.trim(),
      isDefault: form.value.preferredOperator === 'ORANGE_MONEY'
    });
  }

  saving.value = true;
  errors.value = {};
  try {
    const result = await onboardingService.complete({
      companyName: form.value.companyName.trim(),
      phone: cleanPhone(form.value.phone),
      payoutAccounts
    });
    userStore.user = result.user;
    userStore.isAuthenticated = true;
    router.replace(getPostOnboardingRedirect());
  } catch (error) {
    errors.value.general = getUserFriendlyError(error, 'save');
  } finally {
    saving.value = false;
  }
};

onMounted(loadStatus);
</script>

<template>
  <div class="min-h-screen bg-slate-50 px-4 py-5 sm:py-8">
    <main class="mx-auto w-full max-w-lg">
      <div class="mb-5 flex items-center gap-3">
        <div class="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white">
          <Store :size="23" />
        </div>
        <div>
          <h1 class="text-xl font-bold text-slate-950">Compléter le profil</h1>
          <p class="text-sm text-slate-500">{{ displayUserContact }}</p>
        </div>
      </div>

      <div v-if="errors.general" class="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
        {{ errors.general }}
      </div>

      <form class="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" @submit.prevent="submit">
        <section class="space-y-3">
          <div class="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Store :size="18" />
            Boutique
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-semibold text-slate-700">Nom boutique</label>
            <input
              v-model="form.companyName"
              type="text"
              class="w-full rounded-lg border px-3 py-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              :class="errors.companyName ? 'border-red-400' : 'border-slate-300'"
              placeholder="Ex: Boutique Ndiaye"
            />
            <p v-if="errors.companyName" class="mt-1 text-xs font-medium text-red-600">{{ errors.companyName }}</p>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-semibold text-slate-700">Téléphone vendeur</label>
            <div class="relative">
              <Phone :size="18" class="absolute left-3 top-3.5 text-slate-400" />
              <input
                v-model="form.phone"
                type="tel"
                class="w-full rounded-lg border py-3 pl-10 pr-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                :class="errors.phone ? 'border-red-400' : 'border-slate-300'"
                placeholder="77 123 45 67"
              />
            </div>
            <p v-if="errors.phone" class="mt-1 text-xs font-medium text-red-600">{{ errors.phone }}</p>
          </div>
        </section>

        <section class="space-y-3 border-t border-slate-100 pt-4">
          <div class="flex items-center gap-2 text-sm font-bold text-slate-900">
            <Wallet :size="18" />
            Réception paiements
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-semibold text-slate-700">Nom titulaire</label>
            <input
              v-model="form.holderName"
              type="text"
              class="w-full rounded-lg border px-3 py-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              :class="errors.holderName ? 'border-red-400' : 'border-slate-300'"
              placeholder="Nom sur le compte Wave/OM"
            />
            <p v-if="errors.holderName" class="mt-1 text-xs font-medium text-red-600">{{ errors.holderName }}</p>
          </div>

          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MobileMoneyIcon operator="WAVE" size="sm" />
                Wave
              </label>
              <input
                v-model="form.wavePhone"
                type="tel"
                class="w-full rounded-lg border px-3 py-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                :class="errors.wavePhone ? 'border-red-400' : 'border-slate-300'"
                placeholder="77 000 00 00"
              />
              <p v-if="errors.wavePhone" class="mt-1 text-xs font-medium text-red-600">{{ errors.wavePhone }}</p>
            </div>

            <div>
              <label class="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                <MobileMoneyIcon operator="ORANGE_MONEY" size="sm" />
                Orange Money
              </label>
              <input
                v-model="form.orangeMoneyPhone"
                type="tel"
                class="w-full rounded-lg border px-3 py-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                :class="errors.orangeMoneyPhone ? 'border-red-400' : 'border-slate-300'"
                placeholder="77 000 00 00"
              />
              <p v-if="errors.orangeMoneyPhone" class="mt-1 text-xs font-medium text-red-600">{{ errors.orangeMoneyPhone }}</p>
            </div>
          </div>

          <p v-if="errors.payout" class="text-xs font-medium text-red-600">{{ errors.payout }}</p>

          <div class="grid grid-cols-2 gap-2" v-if="hasWave || hasOrangeMoney">
            <button
              type="button"
              :disabled="!hasWave"
              class="rounded-lg border px-3 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
              :class="form.preferredOperator === 'WAVE' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600'"
              @click="form.preferredOperator = 'WAVE'"
            >
              <span class="inline-flex items-center justify-center gap-2">
                <MobileMoneyIcon operator="WAVE" size="sm" />
                Wave par défaut
              </span>
            </button>
            <button
              type="button"
              :disabled="!hasOrangeMoney"
              class="rounded-lg border px-3 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
              :class="form.preferredOperator === 'ORANGE_MONEY' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-600'"
              @click="form.preferredOperator = 'ORANGE_MONEY'"
            >
              <span class="inline-flex items-center justify-center gap-2">
                <MobileMoneyIcon operator="ORANGE_MONEY" size="sm" />
                OM par défaut
              </span>
            </button>
          </div>
        </section>

        <button
          type="submit"
          :disabled="loading || saving"
          class="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-3.5 text-base font-bold text-white shadow-sm disabled:opacity-60"
        >
          <CheckCircle :size="20" />
          {{ saving ? 'Enregistrement...' : 'Terminer' }}
        </button>
      </form>
    </main>
  </div>
</template>
