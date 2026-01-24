<script setup>
import { ref } from 'vue';
import { Phone, Mail, MapPin, Clock, Facebook, Twitter, Instagram, Linkedin } from 'lucide-vue-next';

const formData = ref({
  name: '',
  email: '',
  phone: '',
  message: ''
});

const maxMessageLength = 500;

const handleSubmit = () => {
  console.log('Form submitted:', formData.value);
  // Construct WhatsApp message
  const message = `Bonjour, je m'appelle ${formData.value.name}. ${formData.value.message}`;
  const whatsappUrl = `https://wa.me/221781157773?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};
</script>

<template>
  <section id="contact" class="bg-gray-50 py-24 relative overflow-hidden">
    <!-- Decorative Background Elements -->
    <div class="absolute top-20 left-10 w-72 h-72 bg-teal-400/10 rounded-full blur-3xl"></div>
    <div class="absolute bottom-20 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl"></div>
    
    <div class="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
      <!-- Badge -->
      <div class="text-center mb-8">
        <span class="inline-block px-6 py-2.5 bg-teal-50 text-teal-600 rounded-full text-sm font-semibold border border-teal-100">
          Contact
        </span>
      </div>

      <!-- Heading -->
      <h2 class="text-4xl md:text-5xl font-bold text-center mb-6 text-gray-900">
        Contactez-nous
      </h2>

      <!-- Subtitle -->
      <p class="text-center text-gray-600 text-lg mb-16 max-w-3xl mx-auto">
        Une question ? Besoin d'aide ? Notre équipe est là pour vous accompagner
      </p>

      <!-- Two Column Layout -->
      <div class="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
        <!-- Left Column: Contact Form -->
        <div class="bg-white rounded-3xl p-10 shadow-lg border border-gray-100">
          <h3 class="text-2xl font-bold text-gray-900 mb-8">
            Envoyez-nous un message
          </h3>

          <form @submit.prevent="handleSubmit" class="space-y-6">
            <!-- Name Field -->
            <div>
              <label for="name" class="block text-sm font-semibold text-gray-700 mb-2">
                Nom complet
              </label>
              <input
                id="name"
                v-model="formData.name"
                type="text"
                placeholder="Votre nom"
                class="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>

            <!-- Email Field -->
            <div>
              <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                v-model="formData.email"
                type="email"
                placeholder="votre@email.com"
                class="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors text-gray-900 placeholder:text-gray-400"
                
              />
            </div>

            <!-- Phone Field -->
            <div>
              <label for="phone" class="block text-sm font-semibold text-gray-700 mb-2">
                Téléphone
              </label>
              <input
                id="phone"
                v-model="formData.phone"
                type="tel"
                placeholder="+221 XX XXX XX XX"
                class="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors text-gray-900 placeholder:text-gray-400"
                required
              />
            </div>

            <!-- Message Field -->
            <div>
              <label for="message" class="block text-sm font-semibold text-gray-700 mb-2">
                Message
              </label>
              <textarea
                id="message"
                v-model="formData.message"
                :maxlength="maxMessageLength"
                rows="5"
                placeholder="Comment pouvons-nous vous aider ?"
                class="w-full px-5 py-3.5 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:outline-none transition-colors text-gray-900 placeholder:text-gray-400 resize-none"
                required
              ></textarea>
              <p class="text-sm text-gray-500 mt-2">
                {{ formData.message.length }}/{{ maxMessageLength }} caractères
              </p>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              class="w-full px-8 py-4 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
            >
              Envoyer le message
            </button>
          </form>
        </div>

        <!-- Right Column: Contact Information -->
        <div class="space-y-8">
          <div class="bg-white rounded-3xl p-10 shadow-lg border border-gray-100">
            <h3 class="text-2xl font-bold text-gray-900 mb-8">
              Informations de contact
            </h3>

            <div class="space-y-8">
              <!-- Phone -->
              <div class="flex gap-4">
                <div class="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Phone :size="24" :stroke-width="2" class="text-teal-600" />
                </div>
                <div>
                  <h4 class="text-lg font-bold text-gray-900 mb-2">Téléphone</h4>
                  <p class="text-gray-600">+221 781 157 773</p>
                 
                </div>
              </div>

              <!-- Email -->
              <div class="flex gap-4">
                <div class="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Mail :size="24" :stroke-width="2" class="text-teal-600" />
                </div>
                <div>
                  <h4 class="text-lg font-bold text-gray-900 mb-2">Email</h4>
                  <p class="text-gray-600">sembenpape4@gmail.com</p>
                  <p class="text-gray-600">contact@paytranche.sn</p>
                </div>
              </div>

              <!-- Address -->
              <div class="flex gap-4">
                <div class="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <MapPin :size="24" :stroke-width="2" class="text-teal-600" />
                </div>
                <div>
                  <h4 class="text-lg font-bold text-gray-900 mb-2">Adresse</h4>
                  <p class="text-gray-600">Dakar Rufisque, Sénégal</p>
                
                </div>
              </div>

              <!-- Hours -->
              <div class="flex gap-4">
                <div class="w-14 h-14 bg-teal-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Clock :size="24" :stroke-width="2" class="text-teal-600" />
                </div>
                <div>
                  <h4 class="text-lg font-bold text-gray-900 mb-2">Horaires</h4>
                  <p class="text-gray-600">Lundi - Vendredi : 8h - 18h</p>
                  <p class="text-gray-600">Samedi : 9h - 13h</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Social Media Card -->
          <div class="bg-gradient-to-br from-teal-500 to-teal-600 rounded-3xl p-10 shadow-lg text-white">
            <h3 class="text-2xl font-bold mb-4">
              Suivez-nous
            </h3>
            <p class="text-white/90 mb-6 leading-relaxed">
              Restez connecté avec nous sur les réseaux sociaux pour les dernières actualités et conseils
            </p>
            
            <!-- Social Icons -->
            <div class="flex gap-4">
              <a 
                href="#" 
                class="w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all hover:scale-110"
                aria-label="Facebook"
              >
                <Facebook :size="24" :stroke-width="2" class="text-white" />
              </a>
              <a 
                href="#" 
                class="w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all hover:scale-110"
                aria-label="Twitter"
              >
                <Twitter :size="24" :stroke-width="2" class="text-white" />
              </a>
              <a 
                href="#" 
                class="w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all hover:scale-110"
                aria-label="Instagram"
              >
                <Instagram :size="24" :stroke-width="2" class="text-white" />
              </a>
              <a 
                href="#" 
                class="w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all hover:scale-110"
                aria-label="LinkedIn"
              >
                <Linkedin :size="24" :stroke-width="2" class="text-white" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>