<script setup>
import { computed, ref } from 'vue';
import { AlertTriangle, X } from 'lucide-vue-next';

const dismissed = ref(sessionStorage.getItem('maintenance_banner_dismissed') === 'true');

const enabled = computed(() => import.meta.env.VITE_MAINTENANCE_ENABLED === 'true');
const title = computed(() => import.meta.env.VITE_MAINTENANCE_TITLE || 'Maintenance prévue');
const message = computed(() =>
  import.meta.env.VITE_MAINTENANCE_MESSAGE ||
  'Le service peut être lent ou indisponible pendant quelques minutes.'
);

const visible = computed(() => enabled.value && !dismissed.value);

const close = () => {
  dismissed.value = true;
  sessionStorage.setItem('maintenance_banner_dismissed', 'true');
};
</script>

<template>
  <div
    v-if="visible"
    class="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-xl"
  >
    <div class="flex items-start gap-3">
      <div class="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
        <AlertTriangle :size="20" />
      </div>
      <div class="min-w-0 flex-1">
        <p class="font-black text-amber-950">{{ title }}</p>
        <p class="mt-1 text-sm font-semibold leading-6 text-amber-800">{{ message }}</p>
      </div>
      <button
        type="button"
        class="shrink-0 rounded-lg p-2 text-amber-700 hover:bg-amber-100"
        aria-label="Fermer"
        @click="close"
      >
        <X :size="18" />
      </button>
    </div>
  </div>
</template>
