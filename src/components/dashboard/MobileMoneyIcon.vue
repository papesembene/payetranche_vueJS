<script setup>
import { computed } from 'vue';
import orangeMoneyLogo from '../../assets/payment-logos/orange-money.svg';
import waveLogo from '../../assets/payment-logos/wave.png';

const props = defineProps({
  operator: {
    type: String,
    required: true
  },
  size: {
    type: String,
    default: 'md'
  }
});

const operators = {
  WAVE: {
    label: 'Wave',
    short: 'W',
    logo: waveLogo,
    className: 'border-cyan-100 bg-white'
  },
  ORANGE_MONEY: {
    label: 'Orange Money',
    short: 'OM',
    logo: orangeMoneyLogo,
    className: 'border-orange-100 bg-white'
  }
};

const sizeClass = computed(() => {
  const sizes = {
    sm: 'h-9 w-14 text-[10px]',
    md: 'h-11 w-16 text-xs',
    lg: 'h-12 w-20 text-sm'
  };

  return sizes[props.size] || sizes.md;
});

const config = computed(() => operators[props.operator] || {
  label: props.operator,
  short: '?',
  logo: null,
  className: 'bg-slate-500 text-white ring-slate-100'
});
</script>

<template>
  <span
    :aria-label="config.label"
    :title="config.label"
    :class="[
      'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg border p-1.5 font-black shadow-sm',
      sizeClass,
      config.className
    ]"
  >
    <img
      v-if="config.logo"
      :src="config.logo"
      :alt="config.label"
      class="max-h-full max-w-full object-contain"
    />
    <span v-else>{{ config.short }}</span>
  </span>
</template>
