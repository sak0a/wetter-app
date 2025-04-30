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

<style scoped>
.units-toggle-wrapper {
  position: relative;
}

.units-toggle-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: rgba(16, 17, 36, 0.8);
}

.units-toggle-button:hover {
  background: rgba(255, 255, 255, 0.15);
}

.units-dropdown {
  position: absolute;
  top: calc(100% + 5px);
  right: 0;
  background: rgba(16, 17, 36, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 10;
  width: 150px;
  overflow: hidden;
  backdrop-filter: blur(12px);
  animation: fadeIn 0.2s ease-out;
}

.units-option {
  display: block;
  width: 100%;
  text-align: left;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
}

.units-option:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.units-option.active {
  background: rgba(79, 109, 245, 0.3);
  color: white;
  font-weight: 500;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>