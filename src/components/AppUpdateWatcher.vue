<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { RefreshCw } from 'lucide-vue-next';

const VERSION_STORAGE_KEY = 'paytranche_app_version';
const updating = ref(false);
let checking = false;

const loadRemoteVersion = async () => {
  const response = await fetch(`/version.json?t=${Date.now()}`, {
    cache: 'no-store',
    headers: {
      'cache-control': 'no-cache'
    }
  });

  if (!response.ok) return null;
  return response.json();
};

const refreshApp = (nextVersion) => {
  updating.value = true;
  localStorage.setItem(VERSION_STORAGE_KEY, nextVersion);

  window.setTimeout(() => {
    window.location.reload();
  }, 900);
};

const checkForUpdate = async () => {
  if (checking || updating.value) return;
  checking = true;

  try {
    const remote = await loadRemoteVersion();
    const nextVersion = remote?.version;
    if (!nextVersion) return;

    const currentVersion = localStorage.getItem(VERSION_STORAGE_KEY);
    if (!currentVersion) {
      localStorage.setItem(VERSION_STORAGE_KEY, nextVersion);
      return;
    }

    if (currentVersion !== nextVersion) {
      refreshApp(nextVersion);
    }
  } catch {
    // If the user is offline or the network is unstable, keep the current app.
  } finally {
    checking = false;
  }
};

const handleVisibilityChange = () => {
  if (document.visibilityState === 'visible') {
    checkForUpdate();
  }
};

onMounted(() => {
  checkForUpdate();
  window.addEventListener('focus', checkForUpdate);
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onBeforeUnmount(() => {
  window.removeEventListener('focus', checkForUpdate);
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});
</script>

<template>
  <div
    v-if="updating"
    class="fixed inset-0 z-[9999] flex items-center justify-center bg-white/95 px-6 text-center"
  >
    <div class="w-full max-w-xs">
      <div class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
        <RefreshCw :size="28" class="animate-spin" />
      </div>
      <h2 class="text-xl font-black text-slate-950">Mise à jour...</h2>
      <p class="mt-2 text-sm font-semibold text-slate-500">
        PayTranche charge la dernière version.
      </p>
    </div>
  </div>
</template>
