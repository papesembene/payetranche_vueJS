<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { AlertTriangle, CheckCircle2, Copy, MessageCircle, RefreshCw } from 'lucide-vue-next';
import { notificationService } from '../../services/notification.service.js';
import { safeFormatDate } from '../../utils/export.js';
import { getUserFriendlyError } from '../../utils/userFriendlyError.js';

const props = defineProps({
  refresh: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(['updated']);

const reminders = ref([]);
const loading = ref(false);
const error = ref('');
const copiedId = ref('');
const markingId = ref('');

const dueTodayCount = computed(() => reminders.value.filter((item) => item.overdueDays === 0).length);
const lateCount = computed(() => reminders.value.filter((item) => item.overdueDays > 0).length);
const totalAmount = computed(() => reminders.value.reduce((total, item) => total + Number(item.amount || 0), 0));

const formatAmount = (amount) => `${new Intl.NumberFormat('fr-FR').format(Number(amount || 0))} FCFA`;
const formatDate = (date) => safeFormatDate(date);

const normalizeWhatsAppPhone = (phone) => {
  const digits = String(phone || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('221')) return digits;
  if (digits.length === 9 && digits.startsWith('7')) return `221${digits}`;
  return digits;
};

const getWhatsAppUrl = (reminder) => {
  const phone = normalizeWhatsAppPhone(reminder.clientPhone);
  if (!phone) return '';
  return `https://wa.me/${phone}?text=${encodeURIComponent(reminder.whatsappMessage || '')}`;
};

const loadReminders = async () => {
  loading.value = true;
  error.value = '';

  try {
    reminders.value = await notificationService.getTodayReminders();
  } catch (loadError) {
    error.value = getUserFriendlyError(loadError, 'reminders');
  } finally {
    loading.value = false;
  }
};

const markReminder = async (reminder) => {
  markingId.value = reminder.id;

  try {
    await notificationService.markWhatsAppReminder(reminder.type, reminder.sourceId);
    await loadReminders();
    emit('updated');
  } catch (markError) {
    error.value = getUserFriendlyError(markError, 'reminders');
  } finally {
    markingId.value = '';
  }
};

const sendWhatsApp = async (reminder) => {
  const url = getWhatsAppUrl(reminder);
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
  await markReminder(reminder);
};

const copyMessage = async (reminder) => {
  try {
    await navigator.clipboard.writeText(reminder.whatsappMessage || '');
    copiedId.value = reminder.id;
    setTimeout(() => {
      if (copiedId.value === reminder.id) copiedId.value = '';
    }, 1800);
  } catch (copyError) {
    error.value = 'Copie impossible sur ce navigateur';
  }
};

watch(() => props.refresh, loadReminders);

onMounted(() => {
  loadReminders();
});
</script>

<template>
  <div class="space-y-4">
    <div class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 class="text-lg font-black text-gray-950">À relancer aujourd’hui</h2>
          <p class="text-sm font-semibold text-gray-500">{{ reminders.length }} relance{{ reminders.length > 1 ? 's' : '' }}</p>
        </div>

        <button
          type="button"
          @click="loadReminders"
          :disabled="loading"
          class="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 text-sm font-bold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-60"
        >
          <RefreshCw :size="18" :class="{ 'animate-spin': loading }" />
          Actualiser
        </button>
      </div>

      <div class="mt-4 grid grid-cols-3 gap-2">
        <div class="rounded-lg bg-amber-50 p-3">
          <p class="text-xs font-bold uppercase text-amber-700">Aujourd’hui</p>
          <p class="text-lg font-black text-gray-950">{{ dueTodayCount }}</p>
        </div>
        <div class="rounded-lg bg-red-50 p-3">
          <p class="text-xs font-bold uppercase text-red-700">Retard</p>
          <p class="text-lg font-black text-gray-950">{{ lateCount }}</p>
        </div>
        <div class="rounded-lg bg-teal-50 p-3">
          <p class="text-xs font-bold uppercase text-teal-700">Montant</p>
          <p class="text-base font-black text-gray-950">{{ formatAmount(totalAmount) }}</p>
        </div>
      </div>
    </div>

    <div v-if="error" class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
      {{ error }}
    </div>

    <div v-if="loading && reminders.length === 0" class="rounded-lg border border-gray-200 bg-white p-6 text-center text-sm font-semibold text-gray-500">
      Chargement...
    </div>

    <div v-else-if="reminders.length === 0" class="rounded-lg border border-gray-200 bg-white p-6 text-center">
      <CheckCircle2 :size="34" class="mx-auto mb-2 text-teal-500" />
      <p class="font-black text-gray-950">Aucune relance</p>
      <p class="text-sm font-semibold text-gray-500">Tout est à jour.</p>
    </div>

    <div v-else class="grid gap-3">
      <article
        v-for="reminder in reminders"
        :key="reminder.id"
        class="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <h3 class="truncate text-base font-black text-gray-950">{{ reminder.clientName }}</h3>
              <span
                :class="[
                  'rounded-full px-2.5 py-1 text-xs font-black',
                  reminder.overdueDays > 0 ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'
                ]"
              >
                {{ reminder.overdueDays > 0 ? `${reminder.overdueDays}j retard` : 'Aujourd’hui' }}
              </span>
              <span v-if="reminder.remindedToday" class="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-black text-teal-700">
                Relancé
              </span>
            </div>
            <p class="mt-1 text-sm font-semibold text-gray-500">{{ reminder.clientPhone || 'Téléphone manquant' }}</p>
          </div>
          <AlertTriangle v-if="reminder.overdueDays > 0" :size="22" class="shrink-0 text-red-500" />
        </div>

        <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div class="rounded-lg bg-gray-50 p-3">
            <p class="font-bold text-gray-500">{{ reminder.title }}</p>
            <p class="mt-1 font-black text-gray-950">{{ formatAmount(reminder.amount) }}</p>
          </div>
          <div class="rounded-lg bg-gray-50 p-3">
            <p class="font-bold text-gray-500">Échéance</p>
            <p class="mt-1 font-black text-gray-950">{{ formatDate(reminder.dueDate) }}</p>
          </div>
        </div>

        <p v-if="reminder.description" class="mt-3 line-clamp-2 text-sm font-semibold text-gray-500">
          {{ reminder.description }}
        </p>

        <div class="mt-4 grid grid-cols-[1fr_auto] gap-2">
          <button
            type="button"
            @click="sendWhatsApp(reminder)"
            :disabled="!getWhatsAppUrl(reminder) || markingId === reminder.id"
            class="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 text-sm font-black text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            <MessageCircle :size="18" />
            WhatsApp
          </button>
          <button
            type="button"
            @click="copyMessage(reminder)"
            class="inline-flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50"
            :aria-label="copiedId === reminder.id ? 'Message copié' : 'Copier le message'"
            :title="copiedId === reminder.id ? 'Message copié' : 'Copier le message'"
          >
            <CheckCircle2 v-if="copiedId === reminder.id" :size="20" class="text-teal-600" />
            <Copy v-else :size="20" />
          </button>
        </div>

        <p v-if="reminder.reminderCount > 0" class="mt-3 text-xs font-bold text-gray-400">
          {{ reminder.reminderCount }} relance{{ reminder.reminderCount > 1 ? 's' : '' }} déjà préparée{{ reminder.reminderCount > 1 ? 's' : '' }}
        </p>
      </article>
    </div>
  </div>
</template>
