// components/SavedLocationsScript.vue
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

<script src="./SavedLocationsScript.js"></script>
<style src="./SavedLocationsCSS.css" scoped></style>