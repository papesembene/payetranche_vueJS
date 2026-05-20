<script setup>
import { ref, onMounted } from 'vue';
import { Download, X } from 'lucide-vue-next';

const showPrompt = ref(false);
const deferredPrompt = ref(null);

const hidePrompt = () => {
  showPrompt.value = false;
};

const installPWA = async () => {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt();
    const { outcome } = await deferredPrompt.value.userChoice;
    console.log(`User response to install prompt: ${outcome}`);
    deferredPrompt.value = null;
    hidePrompt();
  }
};

onMounted(() => {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt.value = e;
    showPrompt.value = true;
  });

  // Hide prompt if already installed
  window.addEventListener('appinstalled', () => {
    hidePrompt();
    console.log('PWA was installed');
  });
});
</script>

<template>
  <div v-if="showPrompt" class="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50">
    <div class="flex items-start gap-3">
      <div class="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center flex-shrink-0">
        <Download :size="24" class="text-teal-600" />
      </div>
      <div class="flex-1">
        <h3 class="font-semibold text-gray-900 mb-1">Installer Paytranche</h3>
        <p class="text-sm text-gray-600 mb-3">
          Installez l'application pour un accès rapide depuis votre téléphone.
        </p>
        <div class="flex gap-2">
          <button
            @click="installPWA"
            class="flex-1 bg-teal-500 hover:bg-teal-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Installer
          </button>
          <button
            @click="hidePrompt"
            class="px-3 py-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            Plus tard
          </button>
        </div>
      </div>
      <button
        @click="hidePrompt"
        class="p-1 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <X :size="16" class="text-gray-500" />
      </button>
    </div>
  </div>
</template>
