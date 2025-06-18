<template>
  <!-- Fullscreen Overlay -->
  <div v-if="isFullscreen" class="map-fullscreen-overlay active" @click="toggleFullscreen"></div>

  <div class="map-container glass" :class="{ fullscreen: isFullscreen }">
    <div id="map" class="map-element"></div>

    <!-- Weather Overlay for zoomed-out view -->
    <div v-if="showWeatherOverlay && weatherData" class="weather-overlay">
      <div class="weather-overlay-content">
        <div class="overlay-header">
          <h3 class="overlay-location">{{ weatherData.name }}</h3>
          <div class="overlay-temp">
            {{ useImperialUnits ? formatTempF(weatherData.current?.temp) : formatTempC(weatherData.current?.temp) }}
          </div>
        </div>

        <div class="overlay-main">
          <div class="overlay-icon">
            <img
              :src="getWeatherIconUrl(weatherData.current?.weather?.[0]?.icon)"
              :alt="weatherData.current?.weather?.[0]?.description"
            />
          </div>
          <div class="overlay-condition">
            {{ getGermanWeatherCondition(weatherData.current?.weather?.[0]?.main) }}
          </div>
        </div>

        <div class="overlay-metrics">
          <div class="overlay-metric">
            <span class="metric-label">Luftdruck</span>
            <span class="metric-value">{{ weatherData.current?.pressure ? weatherData.current.pressure.toFixed(2) : 'N/A' }} hPa</span>
          </div>
          <div class="overlay-metric">
            <span class="metric-label">Wind</span>
            <span class="metric-value">{{ Math.round((weatherData.current?.wind_speed || 0) * 3.6) }} km/h</span>
          </div>
          <div class="overlay-metric">
            <span class="metric-label">Luftfeuchtigkeit</span>
            <span class="metric-value">{{ weatherData.current?.humidity || 'N/A' }}%</span>
          </div>
          <div class="overlay-metric">
            <span class="metric-label">Sichtweite</span>
            <span class="metric-value">{{ getVisibilityValue(weatherData.current) }}</span>
          </div>
          <div class="overlay-metric">
            <span class="metric-label">Luftqualität</span>
            <span class="metric-value">{{ getAirQualityValue(weatherData.current) }}</span>
          </div>
          <div class="overlay-metric">
            <span class="metric-label">Taupunkt</span>
            <span class="metric-value">{{ getDewPointValue(weatherData.current) }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Layer Control Panel -->
    <div v-if="showLayerControl" class="layer-control-panel">
      <h4>Map Layers</h4>
      <div v-for="layer in availableLayers" :key="layer.name" class="layer-option">
        <label>
          <input
              type="radio"
              :name="'map-layer'"
              :checked="layer.active"
              @change="toggleLayer(layer)"
          >
          {{ layer.name }}
        </label>
      </div>
    </div>

    <div class="map-controls">
      <div class="map-layers">
        <!-- Fullscreen Toggle Button -->
        <button
            class="map-control-button"
            :class="{ active: isFullscreen }"
            @click="toggleFullscreen"
            :title="isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'"
        >
          <svg v-if="!isFullscreen" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"></path>
          </svg>
        </button>

        <!-- Layer Control Button -->
        <button
            class="map-control-button"
            :class="{ active: showLayerControl }"
            @click="toggleLayerControl"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script src="./WeatherMap.script.js"> </script>
<style src="./WeatherMap.css" scoped></style>