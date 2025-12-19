<script setup>
import { Bell, Settings, DollarSign } from 'lucide-vue-next';
</script>

<template>
  <header class="bg-white border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-6 lg:px-8">
      <div class="flex justify-between items-center h-20">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
            <DollarSign :size="24" :stroke-width="2.5" class="text-white" />
          </div>
          <span class="text-2xl font-bold text-gray-900">PayTranche</span>
        </div>

        <!-- Right Section -->
        <div class="flex items-center gap-4">
          <!-- Notification Icon -->
          <button class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell :size="22" />
          </button>

          <!-- Settings Icon -->
          <button class="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings :size="22" />
          </button>

          <!-- User Avatar -->
          <div class="flex items-center gap-3 ml-2">
            <div class="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center">
              <span class="text-white font-semibold text-lg">A</span>
            </div>
            <div class="hidden md:block">
              <div class="text-sm font-semibold text-gray-900">Admin</div>
              <div class="text-xs text-gray-500">Administrateur</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>