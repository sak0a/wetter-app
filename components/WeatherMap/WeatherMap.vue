<template>
  <div class="map-container glass">
    <div id="map" class="map-element"></div>

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

<script src="./WeatherMapScript.js"> </script>
<style src="./WeatherMapCSS.css"></style>
<style src="./WeatherMapCSS.css" scoped></style>