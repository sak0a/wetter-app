import { defineStore } from 'pinia'

export const useLocationStore = defineStore('locations', {
    state: () => ({
        savedLocations: []
    }),
    persist: true,

    actions: {
        addLocation(location) {

            if (!location.id) {
                location.id = Date.now().toString();
            }

            const nonCurrentLocations = this.savedLocations.filter(loc => !loc.isCurrentLocation);
            if (nonCurrentLocations.length >= 3 && !location.isCurrentLocation) {
                console.log("Maximale Anzahl von regulären Standorten erreicht");
                return false;
            }

            const exists = this.savedLocations.some(loc =>
                loc.id === location.id ||
                (loc.name === location.name && !loc.isCurrentLocation && !location.isCurrentLocation)
            );

            if (!exists) {
                console.log("Füge neuen Standort hinzu:", location.name);
                this.savedLocations.push({...location});
                return true;
            }

            console.log("Standort existiert bereits:", location.name);
            return false;

        },

        removeLocation(locationId) {
            console.log("Removing location with ID:", locationId);
            const beforeLength = this.savedLocations.length;
            this.savedLocations = this.savedLocations.filter(loc => loc.id !== locationId);
            const afterLength = this.savedLocations.length;
            console.log(`Removed ${beforeLength - afterLength} locations. New length: ${afterLength}`);
        },

        updateCurrentLocation(location) {

            this.savedLocations = this.savedLocations.filter(loc => !loc.isCurrentLocation);

            // Stelle sicher, dass die Location als aktueller Standort markiert ist
            const updatedLocation = {
                ...location,
                isCurrentLocation: true,
                id: location.id || 'current-location'
            };


            return this.addLocation(updatedLocation);
        },


        hasCurrentLocation() {
            return this.savedLocations.some(loc => loc.isCurrentLocation);
        }



    },



    getters: {
        canAddLocation: (state) => {
            const nonCurrentLocations = state.savedLocations.filter(loc => !loc.isCurrentLocation);
            return nonCurrentLocations.length < 3;
        },

        currentLocation: (state) => {
            return state.savedLocations.find(loc => loc.isCurrentLocation);
        }
    }
})
