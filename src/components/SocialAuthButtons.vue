<script setup>
import SocialProviderIcon from "./SocialProviderIcon.vue";

defineProps({
  mode: {
    type: String,
    default: "login",
  },
  loadingProvider: {
    type: String,
    default: "",
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["select"]);

const providers = [
  { id: "google", label: "Google" },
  { id: "facebook", label: "Facebook" },
];
</script>

<template>
  <div class="grid gap-2">
    <button
      v-for="provider in providers"
      :key="provider.id"
      type="button"
      :disabled="disabled || Boolean(loadingProvider)"
      class="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      @click="emit('select', provider.id)"
    >
      <SocialProviderIcon :provider="provider.id" />
      <span>
        <template v-if="loadingProvider === provider.id">Connexion...</template>
        <template v-else
          >{{ mode === "register" ? "S’inscrire avec" : "Continuer avec" }}
          {{ provider.label }}</template
        >
      </span>
    </button>
  </div>
</template>
