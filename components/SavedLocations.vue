// components/SavedLocations.vue
<template>
  <div class="saved-locations glass-dark" v-if="history.length > 0">
    <div class="saved-locations-grid">
      <div
          v-for="item in history"
          :key="item.id"
          class="saved-location-item"
          @click="$emit('select', item)"
      >
        <!-- Location Info -->
        <div class="location-info">
          <div class="location-icon">
            <img
                v-if="item.current?.weather && item.current.weather[0]"
                :src="getWeatherIconUrl(item.current.weather[0].icon)"
                :alt="item.current.weather[0].description"
            />
          </div>
          <div class="location-name">{{ item.name }}</div>
        </div>

        <!-- Temperature -->
        <div class="location-temp">
          {{ useImperialUnits ? formatTempF(item.current?.temp) : formatTempC(item.current?.temp) }}
        </div>

        <!-- Actions Menu -->
        <div class="location-actions">
          <button class="menu-button" @click.stop="toggleDropdown(item.id)">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="1"></circle>
              <circle cx="12" cy="5" r="1"></circle>
              <circle cx="12" cy="19" r="1"></circle>
            </svg>
          </button>

          <!-- Dropdown Menu -->
          <div class="dropdown-menu" v-if="activeDropdown === item.id">
            <button class="dropdown-item" @click.stop="$emit('remove', item.id, $event)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              Entfernen
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  history: {
    type: Array,
    default: () => []
  },
  useImperialUnits: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['select', 'remove']);

const activeDropdown = ref(null);

// Toggle dropdown menu
const toggleDropdown = (id) => {
  if (activeDropdown.value === id) {
    activeDropdown.value = null;
  } else {
    activeDropdown.value = id;
  }
};

// Click outside to close dropdown
const closeDropdown = () => {
  activeDropdown.value = null;
};

// Add global click handler for closing dropdowns
if (typeof window !== 'undefined') {
  window.addEventListener('click', (e) => {
    if (!e.target.closest('.menu-button') && !e.target.closest('.dropdown-menu')) {
      closeDropdown();
    }
  });
}

// Format temperature in Celsius
const formatTempC = (temp) => {
  return temp ? `${Math.round(temp)}°C` : 'N/A';
};

// Format temperature in Fahrenheit
const formatTempF = (temp) => {
  return temp ? `${Math.round((temp * 9/5) + 32)}°F` : 'N/A';
};

// Get weather icon URL
const getWeatherIconUrl = (iconCode) => {
  return iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : '';
};
</script>

<style scoped>
.saved-locations {
  padding: 0.75rem;
  margin-top: 1rem;
}

.saved-locations-grid {
  display: flex;
  overflow-x: auto;
  gap: 0.75rem;
  padding: 0.25rem 0;
}

.saved-location-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.875rem;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  min-width: 180px;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.2s ease;
  gap: 1rem;
}

.saved-location-item:hover {
  background: rgba(255, 255, 255, 0.12);
}

.location-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.location-icon {
  width: 36px;
  height: 36px;
}

.location-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.location-name {
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.location-temp {
  font-size: 1rem;
  font-weight: 600;
  min-width: 50px;
  text-align: right;
}

.location-actions {
  position: relative;
}

.menu-button {
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.menu-button:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  background: rgba(16, 17, 36, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  z-index: 10;
  width: 150px;
  overflow: hidden;
  backdrop-filter: blur(12px);
  margin-top: 0.5rem;
  animation: fadeIn 0.2s ease-out;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  color: rgba(255, 255, 255, 0.8);
  text-decoration: none;
  width: 100%;
  text-align: left;
  background: transparent;
  border: none;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.dropdown-item:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.dropdown-item svg {
  color: rgba(255, 255, 255, 0.7);
}

.dropdown-item:hover svg {
  color: rgba(255, 0, 0, 0.8);
}

@media (max-width: 768px) {
  .saved-location-item {
    min-width: 150px;
  }
}
</style>