<script setup>
import { computed, ref } from 'vue';
import { Bell, Settings, DollarSign, Crown, LogOut, ChevronDown, Shield, User } from 'lucide-vue-next';
import { useUser } from '../../composables/useUser.js';
import { useRouter } from 'vue-router';

const router = useRouter();
const { user, currentPlan, loading, logout } = useUser();
const showUserMenu = ref(false);
const adminEmails = (import.meta.env.VITE_PLATFORM_ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);
const isPlatformAdmin = computed(() =>
  import.meta.env.VITE_ALLOW_DEV_ADMIN === 'true' ||
  adminEmails.includes(user.value?.email?.toLowerCase())
);

const handleLogout = async () => {
  await logout();
  router.push('/login');
};
</script>

<template>
  <header class="bg-white border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center h-16 lg:h-20">
        <!-- Logo -->
        <div class="flex items-center gap-2 lg:gap-3 min-w-0">
          <div class="w-10 h-10 lg:w-12 lg:h-12 bg-teal-500 rounded-lg flex items-center justify-center shrink-0">
            <DollarSign :size="22" :stroke-width="2.5" class="text-white" />
          </div>
          <span class="text-lg lg:text-2xl font-bold text-gray-900 truncate">PayTranche</span>
        </div>

        <!-- Right Section -->
        <div class="flex items-center gap-1 sm:gap-3 lg:gap-4">
          <!-- Notification Icon -->
          <button class="hidden sm:block p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell :size="21" />
          </button>

          <!-- Settings Icon -->
          <router-link
            v-if="isPlatformAdmin"
            to="/admin"
            class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Shield :size="21" />
          </router-link>

          <!-- Settings Icon -->
          <router-link
            to="/settings"
            class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings :size="21" />
          </router-link>

          <!-- User Menu -->
          <div
            class="relative ml-0 sm:ml-2"
            @mouseenter="showUserMenu = true"
            @mouseleave="showUserMenu = false"
          >
            <div class="flex items-center gap-2 sm:gap-3 p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
              <div class="w-9 h-9 sm:w-10 sm:h-10 bg-teal-500 rounded-full flex items-center justify-center">
                <span class="text-white font-semibold text-base sm:text-lg">{{ user?.avatar || 'U' }}</span>
              </div>
              <div class="hidden md:block text-left">
                <div class="text-sm font-semibold text-gray-900">{{ user?.name || 'Utilisateur' }}</div>
                <div class="flex items-center gap-1">
                  <Crown :size="12" class="text-teal-500" />
                  <span class="text-xs text-gray-500">{{ currentPlan?.name || 'Chargement...' }}</span>
                </div>
              </div>
              <ChevronDown :size="16" class="text-gray-500 hidden md:block transition-transform" :class="{ 'rotate-180': showUserMenu }" />
            </div>

            <!-- User Dropdown Menu -->
            <div
              v-show="showUserMenu"
              class="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
              @mouseenter="showUserMenu = true"
              @mouseleave="showUserMenu = false"
            >
              <!-- User Info Header -->
              <div class="px-4 py-3 border-b border-gray-200">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
                    <span class="text-white font-semibold">{{ user?.avatar || 'U' }}</span>
                  </div>
                  <div>
                    <div class="text-sm font-semibold text-gray-900">{{ user?.name || 'Utilisateur' }}</div>
                    <div class="flex items-center gap-1">
                      <Crown :size="12" class="text-teal-500" />
                      <span class="text-xs text-gray-500">{{ currentPlan?.name || 'Chargement...' }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Menu Items -->
              <router-link
                v-if="isPlatformAdmin"
                to="/admin"
                @click="showUserMenu = false"
                class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 text-gray-700"
              >
                <Shield :size="18" />
                <span>Admin SaaS</span>
              </router-link>

              <router-link
                to="/settings"
                @click="showUserMenu = false"
                class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 text-gray-700"
              >
                <User :size="18" />
                <span>Mon profil</span>
              </router-link>

              <router-link
                to="/settings"
                @click="showUserMenu = false"
                class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 text-gray-700"
              >
                <Settings :size="18" />
                <span>Paramètres</span>
              </router-link>

              <div class="border-t border-gray-200 my-1"></div>

              <button
                @click="handleLogout"
                class="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-red-50 text-red-600"
              >
                <LogOut :size="18" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>
