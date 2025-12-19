<script setup>
import { ref } from 'vue';
import { Mail, Lock, Eye, EyeOff } from 'lucide-vue-next';
import { SiGoogle, SiFacebook } from 'vue3-icons/si';
import { DollarSign } from 'lucide-vue-next';

const email = ref('');
const password = ref('');
const rememberMe = ref(false);
const showPassword = ref(false);

const handleLogin = () => {
  console.log('Login attempt:', { email: email.value, password: password.value, rememberMe: rememberMe.value });
  // Redirect to dashboard after login
  window.location.href = '/dashboard';
};

const handleGoogleLogin = () => {
  console.log('Google login');
};

const handleFacebookLogin = () => {
  console.log('Facebook login');
};

const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-500 via-teal-600 to-teal-700 px-4 py-12">
    <!-- Login Card -->
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="flex justify-center mb-8">
        <div class="bg-white rounded-2xl shadow-lg px-6 py-3 flex items-center gap-3">
          <div class="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
            <DollarSign :size="24" :stroke-width="2.5" class="text-white" />
          </div>
          <span class="text-2xl font-bold text-gray-900">PayTranche</span>
        </div>
      </div>

      <!-- Login Form Card -->
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <!-- Welcome Text -->
        <h1 class="text-3xl font-bold text-gray-900 mb-2">Bienvenue !</h1>
        <p class="text-gray-600 mb-8">Connectez-vous pour accéder à votre tableau de bord</p>

        <form @submit.prevent="handleLogin" class="space-y-6">
          <!-- Email Field -->
          <div>
            <label for="email" class="block text-sm font-semibold text-gray-700 mb-2">
              Adresse email
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail :size="20" class="text-gray-400" />
              </div>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="exemple@email.com"
                class="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                required
              />
            </div>
          </div>

          <!-- Password Field -->
          <div>
            <label for="password" class="block text-sm font-semibold text-gray-700 mb-2">
              Mot de passe
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock :size="20" class="text-gray-400" />
              </div>
              <input
                id="password"
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                class="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                required
              />
              <button
                type="button"
                @click="togglePasswordVisibility"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Eye v-if="!showPassword" :size="20" />
                <EyeOff v-else :size="20" />
              </button>
            </div>
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                v-model="rememberMe"
                type="checkbox"
                class="w-4 h-4 text-teal-500 border-gray-300 rounded focus:ring-teal-500 cursor-pointer"
              />
              <span class="text-sm text-gray-600">Se souvenir de moi</span>
            </label>
            <a href="#" class="text-sm text-teal-500 hover:text-teal-600 font-medium transition-colors">
              Mot de passe oublié ?
            </a>
          </div>

          <!-- Login Button -->
          <button
            type="submit"
            class="w-full bg-teal-500 hover:bg-teal-600 text-white font-semibold py-3 rounded-xl transition-colors shadow-md hover:shadow-lg"
          >
            Se connecter
          </button>
        </form>

        <!-- Divider -->
        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-gray-300"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-4 bg-white text-gray-500">Ou continuer avec</span>
          </div>
        </div>

        <!-- Social Login Buttons -->
        <div class="grid grid-cols-2 gap-4">
          <button
            type="button"
            @click="handleGoogleLogin"
            class="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <SiGoogle :size="20" class="text-red-500" />
            <span class="font-medium text-gray-700">Google</span>
          </button>
          <button
            type="button"
            @click="handleFacebookLogin"
            class="flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <SiFacebook :size="20" class="text-blue-600" />
            <span class="font-medium text-gray-700">Facebook</span>
          </button>
        </div>

        <!-- Sign Up Link -->
        <p class="text-center text-sm text-gray-600 mt-6">
          Vous n'avez pas de compte ?
          <a href="#" class="text-teal-500 hover:text-teal-600 font-medium transition-colors">
            Créer un compte
          </a>
        </p>
      </div>
    </div>
  </div>
</template>