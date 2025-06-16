<template>
  <div class="units-toggle-wrapper">
    <button
        class="units-toggle-button glass-dark"
        @click="toggleUnits"
    >
      {{ useImperialUnits ? '°F' : '°C' }}
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>

    <div class="units-dropdown" v-if="isOpen">
      <button
          class="units-option"
          :class="{ active: !useImperialUnits }"
          @click="selectUnit(false)"
      >
        °C (Celsius)
      </button>
      <button
          class="units-option"
          :class="{ active: useImperialUnits }"
          @click="selectUnit(true)"
      >
        °F (Fahrenheit)
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  useImperialUnits: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:units']);

const isOpen = ref(false);

// Toggle dropdown
const toggleUnits = () => {
  isOpen.value = !isOpen.value;
};

// Select temperature unit
const selectUnit = (imperial) => {
  emit('update:units', imperial);
  isOpen.value = false;
};

// Close dropdown when clicking outside
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.units-toggle-wrapper')) {
      isOpen.value = false;
    }
  });
}
</script>

<style src="./UnitsToggle.css" scoped></style>