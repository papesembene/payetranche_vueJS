<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { Smartphone, RefreshCw, CheckCircle } from 'lucide-vue-next';
import { payoutService } from '../../services/payout.service.js';
import MobileMoneyIcon from './MobileMoneyIcon.vue';

const loading = ref(true);
const saving = ref(false);
const error = ref('');
const success = ref('');
const profiles = ref([]);

const form = reactive({
  operator: 'WAVE',
  phone: '',
  holderName: '',
  isDefault: false
});

const operators = [
  { value: 'WAVE', label: 'Wave' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' }
];

const configured = computed(() => profiles.value.length > 0);

const profileByOperator = computed(() => {
  return new Map(profiles.value.map((profile) => [profile.operator, profile]));
});

const defaultProfile = computed(() => {
  return profiles.value.find((profile) => profile.isDefault) || profiles.value[0] || null;
});

const operatorLabel = (operator) => {
  return operators.find((item) => item.value === operator)?.label || operator?.replace('_', ' ');
};

const loadData = async () => {
  loading.value = true;
  error.value = '';

  try {
    const profileData = await payoutService.getProfile();

    profiles.value = Array.isArray(profileData) ? profileData : profileData ? [profileData] : [];

    const selectedProfile = profileByOperator.value.get(form.operator);
    if (selectedProfile) {
      form.phone = selectedProfile.phone;
      form.holderName = selectedProfile.holderName;
      form.isDefault = selectedProfile.isDefault;
    }
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Impossible de charger vos numéros.';
  } finally {
    loading.value = false;
  }
};

const saveProfile = async () => {
  saving.value = true;
  error.value = '';
  success.value = '';

  try {
    await payoutService.saveProfile(form);
    success.value = 'Compte enregistré.';
    await loadData();
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Impossible d’enregistrer le compte.';
  } finally {
    saving.value = false;
  }
};

const editOperator = (operator) => {
  const profile = profileByOperator.value.get(operator.value);
  form.operator = operator.value;
  form.phone = profile?.phone || '';
  form.holderName = profile?.holderName || '';
  form.isDefault = profile?.isDefault || profiles.value.length === 0;
};

onMounted(loadData);
</script>

<template>
  <div class="space-y-6">
    <div class="bg-white rounded-xl border border-gray-200 p-6">
      <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-900">Mes numéros</h2>
          <p class="text-gray-600 mt-1">Ces numéros seront montrés au client pour payer directement.</p>
        </div>
        <button
          @click="loadData"
          class="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          <RefreshCw :size="18" />
          Actualiser
        </button>
      </div>

      <div v-if="error" class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
        {{ error }}
      </div>
      <div v-if="success" class="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-green-700">
        {{ success }}
      </div>
    </div>

    <div v-if="loading" class="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-600">
      Chargement...
    </div>

    <template v-else>
      <div class="grid lg:grid-cols-[420px_1fr] gap-6">
        <section class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-5">
            <div class="h-10 w-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Smartphone :size="22" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Comptes de réception</h3>
            </div>
          </div>

          <div class="grid gap-2 mb-5">
            <button
              v-for="operator in operators"
              :key="operator.value"
              @click="editOperator(operator)"
              :class="[
                'flex items-center justify-between rounded-lg border px-3 py-3 text-left',
                form.operator === operator.value ? 'border-teal-400 bg-teal-50' : 'border-gray-200 bg-white'
              ]"
            >
              <span class="flex min-w-0 items-center gap-3">
                <MobileMoneyIcon :operator="operator.value" size="sm" />
                <span class="min-w-0">
                  <span class="block font-semibold text-gray-900">{{ operator.label }}</span>
                  <span class="block truncate text-sm text-gray-500">
                    {{ profileByOperator.get(operator.value)?.phone || 'Non renseigné' }}
                  </span>
                </span>
              </span>
              <span
                v-if="profileByOperator.get(operator.value)?.isDefault"
                class="shrink-0 rounded-full bg-gray-900 px-2 py-1 text-xs font-semibold text-white"
              >
                Principal
              </span>
            </button>
          </div>

          <form @submit.prevent="saveProfile" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Service</label>
              <div class="grid grid-cols-2 gap-2">
                <button
                  v-for="operator in operators"
                  :key="operator.value"
                  type="button"
                  :class="[
                    'flex min-h-[78px] flex-col items-center justify-center gap-2 rounded-lg border px-2 py-3 text-center text-xs font-bold transition-colors',
                    form.operator === operator.value ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-gray-200 bg-white text-gray-700'
                  ]"
                  @click="editOperator(operator)"
                >
                  <MobileMoneyIcon :operator="operator.value" size="sm" />
                  <span>{{ operator.label }}</span>
                </button>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Numéro mobile money</label>
              <input
                v-model.trim="form.phone"
                type="tel"
                required
                placeholder="Ex: 77 000 00 00"
                class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Nom du titulaire</label>
              <input
                v-model.trim="form.holderName"
                type="text"
                required
                placeholder="Nom affiché sur le compte"
                class="w-full rounded-lg border border-gray-300 px-4 py-3 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>

            <label class="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700">
              <input
                v-model="form.isDefault"
                type="checkbox"
                class="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              Compte principal
            </label>

            <button
              type="submit"
              :disabled="saving"
              class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-teal-500 px-4 py-3 font-semibold text-white hover:bg-teal-600 disabled:opacity-60"
            >
              <CheckCircle :size="18" />
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </form>
        </section>

        <section class="bg-white rounded-xl border border-gray-200 p-6">
          <div class="flex items-center gap-3 mb-5">
            <div class="h-10 w-10 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Smartphone :size="22" />
            </div>
            <div>
              <h3 class="font-semibold text-gray-900">Ce que le client voit</h3>
              <p class="text-sm text-gray-500">Le client paie sur ces numéros, puis le vendeur confirme.</p>
            </div>
          </div>

          <div v-if="!configured" class="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-800 mb-4">
            Ajoutez au moins un numéro Wave ou Orange Money.
          </div>

          <div v-else class="space-y-3">
            <div
              v-for="profile in profiles"
              :key="profile.id"
              class="rounded-lg border border-gray-200 p-4"
            >
              <div class="flex items-center gap-3">
                <MobileMoneyIcon :operator="profile.operator" size="sm" />
                <div class="min-w-0">
                  <p class="font-bold text-gray-900">{{ operatorLabel(profile.operator) }}</p>
                  <p class="text-xl font-black text-teal-700">{{ profile.phone }}</p>
                  <p class="text-sm font-semibold text-gray-500">{{ profile.holderName }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-5 rounded-lg bg-gray-50 p-4 text-sm font-semibold text-gray-600">
            Quand le client paie, demandez-lui le reçu Wave/Orange Money puis cliquez sur
            <span class="font-black text-gray-900">Paiement reçu</span> dans sa dette.
          </div>
        </section>
      </div>
    </template>
  </div>
</template>
