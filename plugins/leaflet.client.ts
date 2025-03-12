// This plugin ensures Leaflet only loads on client-side
// File: plugins/leaflet.client.ts

export default defineNuxtPlugin(() => {
    return {
        provide: {
            // This will be empty but ensures the plugin is registered
        }
    }
})