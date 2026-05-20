<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
      <div class="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <XCircle :size="32" class="text-yellow-600" />
      </div>

      <h1 class="text-2xl font-bold text-gray-900 mb-2">Paiement annulé</h1>
      <p class="text-gray-600 mb-6">
        Aucun paiement n’a été confirmé. Vous pouvez relancer le lien PayTech depuis la liste des paiements.
      </p>

      <button
        @click="router.push('/dashboard')"
        class="w-full bg-teal-500 hover:bg-teal-600 text-white font-medium py-3 px-4 rounded-lg transition-colors"
      >
        Retour au tableau de bord
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { XCircle } from 'lucide-vue-next';

const router = useRouter();
</script>
