<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { Capacitor } from "@capacitor/core";
import SocialProviderIcon from "./SocialProviderIcon.vue";

const props = defineProps({
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

const emit = defineEmits(["select", "credential"]);

const googleButton = ref(null);
const googleReady = ref(false);
const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const isNativeApp = Capacitor.isNativePlatform();

const facebookProvider = { id: "facebook", label: "Facebook" };
const googleButtonText = computed(() => (props.mode === "register" ? "signup_with" : "continue_with"));
const facebookButtonLabel = computed(() =>
  `${props.mode === "register" ? "S’inscrire avec" : "Continuer avec"} Facebook`
);

const loadGoogleScript = () => new Promise((resolve, reject) => {
  if (!googleClientId) {
    reject(new Error("Google non configuré"));
    return;
  }

  if (window.google?.accounts?.id) {
    resolve();
    return;
  }

  const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
  if (existingScript) {
    existingScript.addEventListener("load", resolve, { once: true });
    existingScript.addEventListener("error", reject, { once: true });
    return;
  }

  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.defer = true;
  script.onload = resolve;
  script.onerror = reject;
  document.head.appendChild(script);
});

const renderGoogleButton = async () => {
  if (isNativeApp) {
    googleReady.value = false;
    return;
  }

  if (!googleButton.value || !googleClientId) return;

  try {
    await loadGoogleScript();
    window.google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (response) => {
        if (response?.credential) {
          emit("credential", { provider: "google", idToken: response.credential });
        }
      }
    });

    googleButton.value.innerHTML = "";
    window.google.accounts.id.renderButton(googleButton.value, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "rectangular",
      text: googleButtonText.value,
      locale: "fr",
      width: googleButton.value.offsetWidth || 360
    });
    googleReady.value = true;
  } catch {
    googleReady.value = false;
  }
};

onMounted(() => {
  nextTick(renderGoogleButton);
});

watch(() => props.mode, () => {
  nextTick(renderGoogleButton);
});
</script>

<template>
  <div class="grid gap-2">
    <div
      v-if="googleClientId"
      class="min-h-[48px] w-full overflow-hidden rounded-xl"
      :class="{ 'pointer-events-none opacity-60': disabled || Boolean(loadingProvider) }"
    >
      <div v-if="!isNativeApp" ref="googleButton" class="w-full"></div>
      <button
        v-if="isNativeApp || !googleReady"
        type="button"
        :disabled="disabled || Boolean(loadingProvider)"
        class="flex min-h-[48px] w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
        @click="emit('select', 'google')"
      >
        <SocialProviderIcon provider="google" />
        <span>
          <template v-if="loadingProvider === 'google'">Connexion...</template>
          <template v-else>{{ mode === "register" ? "S’inscrire avec" : "Continuer avec" }} Google</template>
        </span>
      </button>
    </div>

    <button
      type="button"
      disabled
      class="flex min-h-[48px] w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm font-bold text-gray-400 opacity-70"
      title="Facebook sera disponible plus tard"
    >
      <SocialProviderIcon :provider="facebookProvider.id" />
      <span>{{ facebookButtonLabel }}</span>
      <span class="rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-black text-gray-500">Bientôt</span>
    </button>
  </div>
</template>
