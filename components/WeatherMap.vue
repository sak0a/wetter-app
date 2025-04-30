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

<style>
/* External Leaflet styles (not scoped) */
.custom-div-icon {
  background: transparent;
  border: none;
}

.marker-pin {
  width: 20px;
  height: 20px;
  border-radius: 50% 50% 50% 0;
  background: #4f6df5;
  position: absolute;
  transform: rotate(-45deg);
  left: 50%;
  top: 50%;
  margin: -15px 0 0 -10px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

.marker-pin::after {
  content: '';
  width: 12px;
  height: 12px;
  margin: 4px 0 0 4px;
  background: #2b3074;
  position: absolute;
  border-radius: 50%;
}

.pulse-icon {
  background: transparent;
  border: none;
}

.pulse-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(79, 109, 245, 0.2);
  position: absolute;
  left: 5px;
  top: 5px;
  animation: pulse-map 2s infinite;
}

@keyframes pulse-map {
  0% {
    transform: scale(0.5);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}
</style>

<style scoped>
.map-container {
  position: relative;
  height: 100%;
  overflow: hidden;
}

.map-element {
  height: 100%;
  width: 100%;
  border-radius: 10px;
  z-index: 1;
}

.map-controls {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
}

.map-layers {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.map-control-button {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: rgba(26, 27, 48, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);
}

.map-control-button:hover {
  background: rgba(79, 109, 245, 0.3);
  color: white;
}

.map-control-button.active {
  background: rgba(79, 109, 245, 0.5);
  color: white;
  border-color: rgba(255, 255, 255, 0.3);
}
</style>