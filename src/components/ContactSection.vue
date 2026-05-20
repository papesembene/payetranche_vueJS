<script setup>
import { ref } from 'vue';
import { Mail, MapPin, MessageCircle, Phone } from 'lucide-vue-next';

const formData = ref({
  name: '',
  phone: '',
  message: ''
});

const handleSubmit = () => {
  const message = `Bonjour, je m'appelle ${formData.value.name}. Téléphone: ${formData.value.phone}. ${formData.value.message}`;
  window.open(`https://wa.me/221781157773?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
};
</script>

<template>
  <section id="contact" class="bg-gray-50 py-20">
    <div class="mx-auto max-w-7xl px-6 lg:px-8">
      <div class="mb-12 text-center">
        <span class="inline-block rounded-lg border border-teal-100 bg-teal-50 px-4 py-2 text-sm font-black text-teal-700">
          Contact
        </span>
        <h2 class="mt-5 text-3xl font-black text-gray-950 sm:text-5xl">
          Parlez-nous de votre activité
        </h2>
        <p class="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
          Vous vendez à crédit ou par tranche ? Écrivez-nous sur WhatsApp pour tester PayTranche.
        </p>
      </div>

      <div class="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[1fr_0.8fr]">
        <form @submit.prevent="handleSubmit" class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <div class="grid gap-4">
            <label class="grid gap-2 text-sm font-bold text-gray-700">
              Nom
              <input
                v-model="formData.name"
                class="rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="Votre nom"
                required
              />
            </label>
            <label class="grid gap-2 text-sm font-bold text-gray-700">
              Téléphone
              <input
                v-model="formData.phone"
                type="tel"
                class="rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="77 123 45 67"
                required
              />
            </label>
            <label class="grid gap-2 text-sm font-bold text-gray-700">
              Message
              <textarea
                v-model="formData.message"
                rows="4"
                class="rounded-lg border border-gray-300 px-4 py-3 text-base outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                placeholder="Ex: je veux gérer les crédits de ma boutique"
                required
              ></textarea>
            </label>
            <button
              type="submit"
              class="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 font-black text-white hover:bg-teal-700"
            >
              <MessageCircle :size="19" />
              Envoyer sur WhatsApp
            </button>
          </div>
        </form>

        <div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h3 class="text-xl font-black text-gray-950">Informations</h3>
          <div class="mt-6 space-y-5">
            <div class="flex gap-3">
              <Phone :size="22" class="text-teal-600" />
              <div>
                <p class="font-black text-gray-950">Téléphone</p>
                <p class="text-gray-600">+221 781 157 773</p>
              </div>
            </div>
            <div class="flex gap-3">
              <Mail :size="22" class="text-teal-600" />
              <div>
                <p class="font-black text-gray-950">Email</p>
                <p class="text-gray-600">sembenpape4@gmail.com</p>
              </div>
            </div>
            <div class="flex gap-3">
              <MapPin :size="22" class="text-teal-600" />
              <div>
                <p class="font-black text-gray-950">Localisation</p>
                <p class="text-gray-600">Dakar Rufisque, Sénégal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
