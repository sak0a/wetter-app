// components/SavedLocationsScript.vue
<template>
  <div class="saved-locations glass-dark" v-if="history.length > 0">
    <div class="saved-locations-grid">
      <div
          v-for="item in history"
          :key="item.id"
          class="saved-location-item"
          :class="{ 'current-location': item.isCurrentLocation }"
          @click="$emit('select', item)"
      >
        <!-- Location Info -->
        <div class="location-info">
          <div class="location-icon">
            <!-- Special icon for current location -->
            <div v-if="item.isCurrentLocation" class="current-location-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
            </div>
            <!-- Weather icon for other locations -->
            <img
                v-else-if="item.current?.weather && item.current.weather[0]"
                :src="getWeatherIconUrl(item.current.weather[0].icon)"
                :alt="item.current.weather[0].description"
            />
          </div>
          <div class="location-name">
            {{ item.name }}
            <span v-if="item.isIPBased" class="ip-indicator" title="Location based on IP address">~</span>
          </div>
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
            <!-- Refresh option for current location -->
            <button v-if="item.isCurrentLocation" class="dropdown-item" @click.stop="$emit('refresh-location', $event)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M3 21v-5h5"></path>
              </svg>
              Standort aktualisieren
            </button>
            <!-- Remove option for regular locations -->
            <button v-else class="dropdown-item" @click.stop="$emit('remove', item.id, $event)">
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

<script src="./SavedLocations.script.js"></script>
<style src="./SavedLocations.css" scoped></style>