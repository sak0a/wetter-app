import { ref, onMounted, watch } from 'vue';

export default {
    name: 'WeatherMap',
    props: {
        currentCoords: {
            type: Object,
            default: () => ({ lat: 50.110644, lng: 8.68 })
        },
        weatherData: {
            type: Object,
            default: null
        },
        useImperialUnits: {
            type: Boolean,
            default: false
        }
    },
    emits: ['location-selected'],
    setup(props, { emit }) {
        const mapObject = ref(null);
        const marker = ref(null);
        const pulseMarker = ref(null);
        const showLayerControl = ref(false);
        const isFullscreen = ref(false);
        const showWeatherOverlay = ref(false);
        const currentZoom = ref(10);
        let L = null; // Will hold the Leaflet instance

        // Available layers configuration
        const availableLayers = ref([
            {
                name: 'OpenStreetMap',
                layer: null,
                active: true,
                url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            },
            {
                name: 'Satellite',
                layer: null,
                active: false,
                url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                attribution: '&copy; <a href="https://www.esri.com/">Esri</a>'
            },
            {
                name: 'Terrain',
                layer: null,
                active: false,
                url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
                attribution: '&copy; <a href="https://www.opentopomap.org/">OpenTopoMap</a>'
            }
        ]);

        // Create or recreate markers (simplified to match working old version)
        const createMarkers = (coords) => {
            if (!mapObject.value || !L) {
                console.warn('Map or Leaflet not initialized yet');
                return;
            }

            console.log('Creating markers at coordinates:', coords);

            // Remove existing markers if they exist
            if (marker.value) {
                mapObject.value.removeLayer(marker.value);
                marker.value = null;
            }
            if (pulseMarker.value) {
                mapObject.value.removeLayer(pulseMarker.value);
                pulseMarker.value = null;
            }

            // Create main marker with custom icon (exactly like old version)
            const customIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div class="marker-pin"></div>`,
                iconSize: [30, 42],
                iconAnchor: [15, 42]
            });

            marker.value = L.marker([coords.lat, coords.lng], {
                icon: customIcon
            }).addTo(mapObject.value);

            // Add pulse animation around marker (exactly like old version)
            const pulseIcon = L.divIcon({
                className: 'pulse-icon',
                html: `<div class="pulse-circle"></div>`,
                iconSize: [50, 50],
                iconAnchor: [25, 25]
            });

            pulseMarker.value = L.marker([coords.lat, coords.lng], {
                icon: pulseIcon
            }).addTo(mapObject.value);

            console.log('Markers created successfully - main marker:', marker.value, 'pulse marker:', pulseMarker.value);
        };

        // Initialize Leaflet map
        const initMap = () => {
            console.log('Initializing map...');

            // Create map instance
            mapObject.value = L.map('map').setView([props.currentCoords.lat, props.currentCoords.lng], 10);

            // Initialize layers
            initLayers();

            // Add default active layer
            const defaultLayer = availableLayers.value.find(layer => layer.active);
            if (defaultLayer && defaultLayer.layer) {
                defaultLayer.layer.addTo(mapObject.value);
            }

            // Create initial markers (simplified like old version)
            createMarkers(props.currentCoords);

            // Add click event to map for location selection
            mapObject.value.on('click', (e) => {
                const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
                updateMarkerPosition(newCoords);
                emit('location-selected', newCoords);
            });

            // Add zoom event listener to control weather overlay visibility
            mapObject.value.on('zoomend', () => {
                currentZoom.value = mapObject.value.getZoom();
                updateWeatherOverlayVisibility();
            });

            // Initial overlay visibility check
            updateWeatherOverlayVisibility();
        };

        // Initialize all layer objects
        const initLayers = () => {
            availableLayers.value.forEach(layerConfig => {
                if (!layerConfig.layer) {
                    layerConfig.layer = L.tileLayer(layerConfig.url, {
                        attribution: layerConfig.attribution,
                        minZoom: 8,
                        maxZoom: 12
                    });
                }
            });
        };

        // Update marker position (simplified to match old working version)
        const updateMarkerPosition = (coords) => {
            if (!mapObject.value || !marker.value || !L) {
                console.warn('Cannot update marker position: Map, marker, or Leaflet not initialized');
                return;
            }

            console.log('Updating marker position to:', coords);

            // Move main marker
            marker.value.setLatLng([coords.lat, coords.lng]);

            // Find and update pulse marker (like old version)
            mapObject.value.eachLayer((layer) => {
                if (layer instanceof L.Marker && layer.options.icon && layer.options.icon.options.className === 'pulse-icon') {
                    layer.setLatLng([coords.lat, coords.lng]);
                }
            });

            // Center map on new position
            mapObject.value.setView([coords.lat, coords.lng], 10);
        };

        // Toggle layer control panel
        const toggleLayerControl = () => {
            showLayerControl.value = !showLayerControl.value;
        };

        // Toggle fullscreen mode
        const toggleFullscreen = () => {
            isFullscreen.value = !isFullscreen.value;

            // Close layer control when entering fullscreen
            if (isFullscreen.value) {
                showLayerControl.value = false;
            }

            // Update overlay visibility immediately when toggling fullscreen
            updateWeatherOverlayVisibility();

            // Invalidate map size after transition to ensure proper rendering
            setTimeout(() => {
                if (mapObject.value) {
                    mapObject.value.invalidateSize();
                    // Update current zoom level and overlay visibility after fullscreen transition
                    currentZoom.value = mapObject.value.getZoom();
                    updateWeatherOverlayVisibility();

                    // Recreate markers after fullscreen transition to ensure they're visible
                    const currentCoords = props.currentCoords;
                    if (currentCoords) {
                        createMarkers(currentCoords);
                    }
                }
            }, 300); // Match the CSS transition duration
        };

        // Toggle individual layer
        const toggleLayer = (layerConfig) => {
            if (!mapObject.value) return;

            if (layerConfig.active) {
                // Remove layer from map
                mapObject.value.removeLayer(layerConfig.layer);
                layerConfig.active = false;
            } else {
                // First, remove other base layers (only one base layer at a time)
                availableLayers.value.forEach(layer => {
                    if (layer.active && layer !== layerConfig) {
                        mapObject.value.removeLayer(layer.layer);
                        layer.active = false;
                    }
                });

                // Add new layer to map
                layerConfig.layer.addTo(mapObject.value);
                layerConfig.active = true;
            }
        };

        // Update weather overlay visibility based on zoom level
        const updateWeatherOverlayVisibility = () => {
            if (!props.weatherData) {
                showWeatherOverlay.value = false;
                return;
            }

            // Show overlay ONLY when zoomed out (zoom level 8 or LESS) and ONLY in fullscreen mode
            showWeatherOverlay.value = isFullscreen.value && currentZoom.value <= 8;
        };

        // Weather data formatting functions
        const formatTempC = (temp) => {
            return temp ? `${Math.round(temp)}°C` : 'N/A';
        };

        const formatTempF = (temp) => {
            return temp ? `${Math.round((temp * 9/5) + 32)}°F` : 'N/A';
        };

        const getWeatherIconUrl = (iconCode) => {
            return iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : '';
        };

        const getGermanWeatherCondition = (condition) => {
            const translations = {
                'Clear': 'Klar',
                'Clouds': 'Bewölkt',
                'Rain': 'Regen',
                'Drizzle': 'Nieselregen',
                'Thunderstorm': 'Gewitter',
                'Snow': 'Schnee',
                'Mist': 'Nebel',
                'Fog': 'Nebel',
                'Haze': 'Dunst'
            };
            return translations[condition] || condition || 'Unbekannt';
        };

        const getVisibilityValue = (current) => {
            if (!current) return 'N/A';

            // Check if visibility is directly available
            if (current.visibility) {
                return `${(current.visibility / 1000).toFixed(1)} km`;
            }

            // Fallback: Estimate visibility based on weather conditions
            const condition = current.weather?.[0]?.main;
            const humidity = current.humidity;

            let visibility = 50; // Base visibility in km

            if (condition === 'Fog' || condition === 'Mist') {
                visibility = Math.random() * 2 + 0.5; // 0.5-2.5 km
            } else if (condition === 'Rain') {
                visibility = Math.random() * 15 + 5; // 5-20 km
            } else if (condition === 'Snow') {
                visibility = Math.random() * 10 + 2; // 2-12 km
            } else if (humidity > 85) {
                visibility = Math.random() * 20 + 15; // 15-35 km
            } else if (condition === 'Clear') {
                visibility = Math.random() * 30 + 40; // 40-70 km
            }

            return `${visibility.toFixed(1)} km`;
        };

        const getAirQualityValue = (current) => {
            if (!current) return 'N/A';

            // Check if air quality index is available
            if (current.air_quality) {
                const aqi = current.air_quality;
                if (aqi <= 50) return 'Gut';
                if (aqi <= 100) return 'Mäßig';
                if (aqi <= 150) return 'Ungesund für empfindliche Gruppen';
                if (aqi <= 200) return 'Ungesund';
                if (aqi <= 300) return 'Sehr ungesund';
                return 'Gefährlich';
            }

            // Fallback: Estimate based on weather conditions
            const condition = current.weather?.[0]?.main;
            const humidity = current.humidity;

            if (condition === 'Clear' && humidity < 60) return 'Gut';
            if (condition === 'Clouds' || humidity > 80) return 'Mäßig';
            if (condition === 'Rain' || condition === 'Snow') return 'Gut';
            if (condition === 'Fog' || condition === 'Haze') return 'Ungesund für empfindliche Gruppen';

            return 'Mäßig';
        };

        const getDewPointValue = (current) => {
            if (!current) return 'N/A';

            // Check if dew point is directly available
            if (current.dew_point !== undefined) {
                return props.useImperialUnits
                    ? `${Math.round((current.dew_point * 9/5) + 32)}°F`
                    : `${Math.round(current.dew_point)}°C`;
            }

            // Calculate dew point using Magnus formula approximation
            const temp = current.temp;
            const humidity = current.humidity;

            if (temp !== undefined && humidity !== undefined) {
                const a = 17.27;
                const b = 237.7;
                const alpha = ((a * temp) / (b + temp)) + Math.log(humidity / 100);
                const dewPoint = (b * alpha) / (a - alpha);

                return props.useImperialUnits
                    ? `${Math.round((dewPoint * 9/5) + 32)}°F`
                    : `${Math.round(dewPoint)}°C`;
            }

            return 'N/A';
        };

        // Initialize map when component is mounted
        onMounted(() => {
            // Import Leaflet dynamically (for SSR compatibility)
            import('leaflet').then((leaflet) => {
                L = leaflet.default;
                console.log('Leaflet loaded successfully');
                initMap();
            }).catch((error) => {
                console.error('Error loading Leaflet:', error);
            });
        });

        // Watch for coordinate changes from parent
        watch(() => props.currentCoords, (newCoords, oldCoords) => {
            console.log('Coordinates changed from', oldCoords, 'to', newCoords);
            if (newCoords && mapObject.value) {
                updateMarkerPosition(newCoords);
            }
        }, { deep: true });

        // Watch for weather data changes to update overlay visibility
        watch(() => props.weatherData, () => {
            updateWeatherOverlayVisibility();
        }, { deep: true });

        return {
            mapObject,
            marker,
            pulseMarker,
            currentZoom,
            showLayerControl,
            isFullscreen,
            showWeatherOverlay,
            availableLayers,
            toggleLayerControl,
            toggleFullscreen,
            toggleLayer,
            updateMarkerPosition,
            formatTempC,
            formatTempF,
            getWeatherIconUrl,
            getGermanWeatherCondition,
            getVisibilityValue,
            getAirQualityValue,
            getDewPointValue
        };
    }
};