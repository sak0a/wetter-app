<template>
  <div class="map-container glass">
    <div id="map" class="map-element"></div>
    <div class="map-controls">
      <div class="map-layers">
        <button class="map-control-button active">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"></polygon>
            <line x1="8" y1="2" x2="8" y2="18"></line>
            <line x1="16" y1="6" x2="16" y2="22"></line>
          </svg>
        </button>
        <button class="map-control-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
          </svg>
        </button>
        <button class="map-control-button">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2v2"/>
            <path d="M12 20v2"/>
            <path d="m4.93 4.93 1.41 1.41"/>
            <path d="m17.66 17.66 1.41 1.41"/>
            <path d="M2 12h2"/>
            <path d="M20 12h2"/>
            <path d="m6.34 17.66-1.41 1.41"/>
            <path d="m19.07 4.93-1.41 1.41"/>
            <circle cx="12" cy="12" r="4"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  currentCoords: {
    type: Object,
    default: () => ({ lat: 51.505, lng: -0.09 }) // Default to London
  }
});

const emit = defineEmits(['location-selected']);

const mapObject = ref(null);
const marker = ref(null);
let L = null; // Will hold the Leaflet instance

// Initialize Leaflet map
onMounted(() => {
  // We're in client-side only mode (ssr: false in nuxt.config.ts)
  // so we can safely import Leaflet
  import('leaflet').then((leaflet) => {
    L = leaflet.default;

    // Create map instance
    mapObject.value = L.map('map').setView([props.currentCoords.lat, props.currentCoords.lng], 10);

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      minZoom: 8, // Restrict minimum zoom to city level
      maxZoom: 12 // Restrict maximum zoom to prevent selection of specific buildings
    }).addTo(mapObject.value);

    // Add initial marker with custom icon
    const customIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="marker-pin"></div>`,
      iconSize: [30, 42],
      iconAnchor: [15, 42]
    });

    marker.value = L.marker([props.currentCoords.lat, props.currentCoords.lng], {
      icon: customIcon
    }).addTo(mapObject.value);

    // Add pulse animation around marker
    const pulseIcon = L.divIcon({
      className: 'pulse-icon',
      html: `<div class="pulse-circle"></div>`,
      iconSize: [50, 50],
      iconAnchor: [25, 25]
    });

    const pulseMarker = L.marker([props.currentCoords.lat, props.currentCoords.lng], {
      icon: pulseIcon
    }).addTo(mapObject.value);

    // Add click event to map for location selection
    mapObject.value.on('click', (e) => {
      const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
      updateMarkerPosition(newCoords);
      emit('location-selected', newCoords);
    });
  });
});

// Watch for coordinate changes from parent
watch(() => props.currentCoords, (newCoords) => {
  if (newCoords && mapObject.value) {
    updateMarkerPosition(newCoords);
  }
}, { deep: true });

// Update marker position
const updateMarkerPosition = (coords) => {
  if (!mapObject.value || !marker.value || !L) return;

  // Move marker
  marker.value.setLatLng([coords.lat, coords.lng]);

  // Find and update pulse marker
  mapObject.value.eachLayer((layer) => {
    if (layer instanceof L.Marker && layer.options.icon && layer.options.icon.options.className === 'pulse-icon') {
      layer.setLatLng([coords.lat, coords.lng]);
    }
  });

  // Center map on new position
  mapObject.value.setView([coords.lat, coords.lng], 10);
};
</script>

<style src="./WeatherMapCSS.css"></style>
<style src="./WeatherMapCSS.css" scoped></style>