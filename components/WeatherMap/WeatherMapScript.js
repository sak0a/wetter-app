import { ref, onMounted, watch } from 'vue';

export default {
    name: 'WeatherMap',
    props: {
        currentCoords: {
            type: Object,
            default: () => ({ lat: 50.110644, lng: 8.68 }) 
        }
    },
    emits: ['location-selected'],
    setup(props, { emit }) {
        const mapObject = ref(null);
        const marker = ref(null);
        const pulseMarker = ref(null);
        const showLayerControl = ref(false);
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

        // Initialize Leaflet map
        const initMap = () => {
            // Create map instance
            mapObject.value = L.map('map').setView([props.currentCoords.lat, props.currentCoords.lng], 10);

            // Initialize layers
            initLayers();

            // Add default active layer
            const defaultLayer = availableLayers.value.find(layer => layer.active);
            if (defaultLayer && defaultLayer.layer) {
                defaultLayer.layer.addTo(mapObject.value);
            }

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

            pulseMarker.value = L.marker([props.currentCoords.lat, props.currentCoords.lng], {
                icon: pulseIcon
            }).addTo(mapObject.value);

            // Add click event to map for location selection
            mapObject.value.on('click', (e) => {
                const newCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
                updateMarkerPosition(newCoords);
                emit('location-selected', newCoords);
            });
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

        // Update marker position
        const updateMarkerPosition = (coords) => {
            if (!mapObject.value || !marker.value || !L) return;

            // Move main marker
            marker.value.setLatLng([coords.lat, coords.lng]);

            // Move pulse marker
            if (pulseMarker.value) {
                pulseMarker.value.setLatLng([coords.lat, coords.lng]);
            }

            // Center map on new position
            mapObject.value.setView([coords.lat, coords.lng], 10);
        };

        // Toggle layer control panel
        const toggleLayerControl = () => {
            showLayerControl.value = !showLayerControl.value;
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

        // Initialize map when component is mounted
        onMounted(() => {
            // Import Leaflet dynamically (for SSR compatibility)
            import('leaflet').then((leaflet) => {
                L = leaflet.default;
                initMap();
            });
        });

        // Watch for coordinate changes from parent
        watch(() => props.currentCoords, (newCoords) => {
            if (newCoords && mapObject.value) {
                updateMarkerPosition(newCoords);
            }
        }, { deep: true });

        return {
            mapObject,
            marker,
            showLayerControl,
            availableLayers,
            toggleLayerControl,
            toggleLayer,
            updateMarkerPosition
        };
    }
};