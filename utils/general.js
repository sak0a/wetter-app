/**
 * General utility functions for the weather app
 * Handles location services, storage, formatting, and other general utilities
 */

/**
 * Get city name from coordinates using reverse geocoding
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object|null>} - City information object or null
 */
export async function getCityName(lat, lng) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
        const data = await response.json();

        if (data && data.address) {
            const address = data.address;
            
            // Priority order: village > town > city > municipality > county
            const city = address.village || address.town || address.city || address.municipality || address.county || 'Unknown Location';

            // For the full name, try to get a more descriptive location
            const region = address.state || address.county || address.country;
            const fullName = region ? `${city}, ${region}` : city;

            return {
                cityName: city,
                fullName: fullName
            };
        }
        return null;
    } catch (error) {
        console.error('Error getting city name:', error);
        return null;
    }
}

/**
 * Search for location using Nominatim API
 * @param {string} query - Search query
 * @returns {Promise<Object|null>} - Location data or null
 */
export async function searchLocation(query) {
    if (!query.trim()) return null;

    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`);
        const data = await response.json();

        if (data && data.length > 0) {
            const result = data[0];
            const address = result.address;

            // Priority order for city name
            const city = address.village || address.town || address.city || address.municipality || address.county || result.display_name;

            // Create a more descriptive full name
            const region = address.state || address.county || address.country;
            const fullName = region ? `${city}, ${region}` : city;

            return {
                coords: {
                    lat: parseFloat(result.lat),
                    lng: parseFloat(result.lon)
                },
                cityInfo: {
                    cityName: city,
                    fullName: fullName
                }
            };
        }
        return null;
    } catch (error) {
        console.error('Error searching location:', error);
        return null;
    }
}

/**
 * Get user's location from IP address
 * @returns {Promise<Object|null>} - Location data or null
 */
export async function getLocationFromIP() {
    try {
        // Using ipapi.co as it's free and doesn't require API key
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();

        if (data.latitude && data.longitude) {
            const coords = {
                lat: parseFloat(data.latitude),
                lng: parseFloat(data.longitude)
            };

            const cityInfo = {
                cityName: data.city || data.region || 'Your Location',
                fullName: `${data.city || data.region}, ${data.country_name || ''}`
            };

            return { coords, cityInfo };
        }
        return null;
    } catch (error) {
        console.error('Failed to get location from IP:', error);
        return null;
    }
}

/**
 * Request user's geolocation
 * @returns {Promise<Object|null>} - Coordinates or null
 */
export function requestGeolocation() {
    return new Promise((resolve) => {
        if (!navigator.geolocation) {
            console.log('Geolocation is not supported by this browser.');
            resolve(null);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                resolve(coords);
            },
            (error) => {
                console.error('Error getting location:', error);
                resolve(null);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 300000 // 5 minutes
            }
        );
    });
}

/**
 * Save data to localStorage
 * @param {string} key - Storage key
 * @param {any} data - Data to save
 */
export function saveToLocalStorage(key, data) {
    if (typeof window !== 'undefined') {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }
}

/**
 * Load data from localStorage
 * @param {string} key - Storage key
 * @returns {any|null} - Loaded data or null
 */
export function loadFromLocalStorage(key) {
    if (typeof window !== 'undefined') {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    }
    return null;
}

/**
 * Remove data from localStorage
 * @param {string} key - Storage key
 */
export function removeFromLocalStorage(key) {
    if (typeof window !== 'undefined') {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error removing from localStorage:', error);
        }
    }
}

/**
 * Check if data in localStorage is expired
 * @param {Object} storedData - Data object with timestamp
 * @param {number} maxAge - Maximum age in milliseconds
 * @returns {boolean} - True if expired
 */
export function isStoredDataExpired(storedData, maxAge) {
    if (!storedData || !storedData.timestamp) return true;
    return Date.now() - storedData.timestamp > maxAge;
}

/**
 * Save weather data as last viewed
 * @param {Object} weatherData - Weather data object
 */
export function saveLastViewedWeather(weatherData) {
    const dataToSave = {
        weatherData,
        coords: weatherData.coords,
        timestamp: Date.now()
    };
    saveToLocalStorage('weatherAppLastViewed', dataToSave);
}

/**
 * Load last viewed weather data
 * @returns {Object|null} - Last viewed weather data or null
 */
export function loadLastViewedWeather() {
    const saved = loadFromLocalStorage('weatherAppLastViewed');
    if (saved) {
        const oneHour = 60 * 60 * 1000; // 1 hour in milliseconds
        if (!isStoredDataExpired(saved, oneHour)) {
            return saved;
        } else {
            removeFromLocalStorage('weatherAppLastViewed');
        }
    }
    return null;
}

/**
 * Save search history
 * @param {Array} history - Search history array
 */
export function saveSearchHistory(history) {
    saveToLocalStorage('weatherAppHistory', history);
}

/**
 * Load search history
 * @returns {Array} - Search history array
 */
export function loadSearchHistory() {
    return loadFromLocalStorage('weatherAppHistory') || [];
}

/**
 * Save current location to history
 * @param {Object} coords - Coordinates object
 * @param {Object} cityInfo - City information object
 * @param {boolean} isIPBased - Whether location is IP-based
 */
export function saveCurrentLocationToHistory(coords, cityInfo, isIPBased = false) {
    const locationData = {
        id: Date.now(),
        name: cityInfo.cityName,
        fullName: cityInfo.fullName,
        coords,
        isCurrentLocation: true,
        isIPBased,
        timestamp: Date.now()
    };
    
    const history = loadSearchHistory();
    
    // Remove any existing current location entries
    const filteredHistory = history.filter(item => !item.isCurrentLocation);
    
    // Add new current location at the beginning
    filteredHistory.unshift(locationData);
    
    // Keep only the last 5 entries
    if (filteredHistory.length > 5) {
        filteredHistory.splice(5);
    }
    
    saveSearchHistory(filteredHistory);
}

/**
 * Format temperature in Celsius
 * @param {number} temp - Temperature value
 * @returns {string} - Formatted temperature string
 */
export function formatTempC(temp) {
    return temp ? `${Math.round(temp)}°C` : 'N/A';
}

/**
 * Format temperature in Fahrenheit
 * @param {number} temp - Temperature value in Celsius
 * @returns {string} - Formatted temperature string
 */
export function formatTempF(temp) {
    return temp ? `${Math.round((temp * 9 / 5) + 32)}°F` : 'N/A';
}

/**
 * Convert wind speed from km/h to m/s
 * @param {number} kmh - Wind speed in km/h
 * @returns {number} - Wind speed in m/s
 */
export function convertKmhToMs(kmh) {
    return kmh / 3.6;
}

/**
 * Convert wind speed from m/s to km/h
 * @param {number} ms - Wind speed in m/s
 * @returns {number} - Wind speed in km/h
 */
export function convertMsToKmh(ms) {
    return ms * 3.6;
}

/**
 * Convert visibility from meters to kilometers
 * @param {number} meters - Visibility in meters
 * @returns {number} - Visibility in kilometers
 */
export function convertMetersToKm(meters) {
    return meters / 1000;
}

/**
 * Check if it's the first visit to the app
 * @returns {boolean} - True if first visit
 */
export function isFirstVisit() {
    const hasVisited = loadFromLocalStorage('weatherAppHasVisited');
    if (!hasVisited) {
        saveToLocalStorage('weatherAppHasVisited', true);
        return true;
    }
    return false;
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Generate unique ID
 * @returns {string} - Unique ID
 */
export function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
