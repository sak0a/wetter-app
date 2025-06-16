import { ref, onMounted } from 'vue';
import Cookies from 'js-cookie';
import SearchBar from "~/components/SearchBar/SearchBar.vue";
import UnitsToggle from "~/components/UnitsToggle/UnitsToggle.vue";
import SavedLocations from "~/components/SavedLocations/SavedLocations.vue";
import WeatherCard from "~/components/WeatherCard/WeatherCard.vue";
import WeatherMap from "~/components/WeatherMap/WeatherMap.vue";
import HourlyForecast from "~/components/HourlyForecast/HourlyForecast.vue";

// Import utility functions
import { getWeatherData, getAirQualityData, getPollenData } from '~/utils/weather.js';
import {
    getCityName,
    searchLocation as searchLocationUtil,
    getLocationFromIP,
    requestGeolocation,
    saveToLocalStorage,
    loadFromLocalStorage,
    removeFromLocalStorage,
    saveLastViewedWeather as saveLastViewedUtil,
    loadLastViewedWeather as loadLastViewedUtil,
    saveSearchHistory as saveSearchHistoryUtil,
    loadSearchHistory as loadSearchHistoryUtil,
    saveCurrentLocationToHistory,
    formatTempC,
    formatTempF,
    isFirstVisit
} from '~/utils/general.js';

export default {
    components: {WeatherMap, WeatherCard, SavedLocations, UnitsToggle, SearchBar, HourlyForecast},
    setup() {
        const isLoading = ref(false);
        const weatherData = ref(null);
        const searchHistory = ref([]);
        const currentCoords = ref({ lat: 50.110644, lng: 8.68 }); // Default to Frankfurt
        const useImperialUnits = ref(false);

        onMounted(() => {
            loadSearchHistoryFromStorage();
            if (typeof window !== 'undefined') {
                const savedUnits = loadFromLocalStorage('weatherAppUnits');
                if (savedUnits) {
                    useImperialUnits.value = savedUnits === 'imperial';
                }

                // Load last viewed weather location first
                loadLastViewedWeatherFromStorage();

                // Check for first visit and request location (only if no last viewed weather)
                if (!weatherData.value) {
                    checkFirstVisitAndRequestLocation();
                }
            }
        });

        const toggleUnits = (imperial) => {
            useImperialUnits.value = imperial;
            saveToLocalStorage('weatherAppUnits', imperial ? 'imperial' : 'metric');
        };

        const loadSearchHistoryFromStorage = () => {
            const historyCookie = Cookies.get('weatherSearchHistory');
            if (historyCookie) {
                try {
                    searchHistory.value = JSON.parse(historyCookie);
                } catch (e) {
                    console.error('Fehler beim Parsen der Cookie-Historie:', e);
                    searchHistory.value = [];
                }
            }
        };

        const saveSearchHistoryToStorage = () => {
            Cookies.set('weatherSearchHistory', JSON.stringify(searchHistory.value), { expires: 30 });
        };

        const saveLastViewedWeatherToStorage = (weather) => {
            saveLastViewedUtil(weather);
        };

        const loadLastViewedWeatherFromStorage = () => {
            const lastViewed = loadLastViewedUtil();
            if (lastViewed) {
                weatherData.value = lastViewed.weatherData;
                currentCoords.value = lastViewed.coords;
                console.log('Loaded last viewed weather:', lastViewed.weatherData.name);
            }
        };

        const searchLocation = async (query) => {
            if (!query.trim()) return;

            isLoading.value = true;
            try {
                const result = await searchLocationUtil(query);
                if (result) {
                    currentCoords.value = result.coords;
                    await getWeatherDataFromAPI(result.coords.lat, result.coords.lng, result.cityInfo);
                } else {
                    alert('Stadt nicht gefunden. Bitte versuchen Sie einen anderen Suchbegriff.');
                }
            } catch (error) {
                console.error('Fehler bei der Ortssuche:', error);
                alert('Fehler bei der Suche nach dem Ort. Bitte erneut versuchen.');
            } finally {
                isLoading.value = false;
            }
        };

        const handleMapLocationSelected = async (coords) => {
            currentCoords.value = coords;
            const cityInfo = await getCityName(coords.lat, coords.lng);
            if (cityInfo) {
                getWeatherDataFromAPI(coords.lat, coords.lng, cityInfo);
            }
        };

        const getWeatherDataFromAPI = async (lat, lng, locationInfo) => {
            try {
                console.log('🌍 Fetching weather data for:', locationInfo);

                // Fetch weather data using the utility function
                const weatherDataResult = await getWeatherData(lat, lng, locationInfo);

                // Fetch air quality data
                const airQualityData = await getAirQualityData(lat, lng);

                // Fetch pollen data (Europe only)
                const pollenData = await getPollenData(lat, lng);

                console.log('📊 API Response Data:');
                console.log('Weather Data:', weatherDataResult);
                console.log('Air Quality Data:', airQualityData);
                console.log('Pollen Data:', pollenData);

                // Combine weather data with air quality and pollen data
                weatherData.value = {
                    ...weatherDataResult,
                    current: {
                        ...weatherDataResult.current,
                        // Add air quality data to current weather
                        air_quality: airQualityData ? {
                            aqi: airQualityData.current?.us_aqi || null,
                            pm10: airQualityData.current?.pm10 || null,
                            pm2_5: airQualityData.current?.pm2_5 || null,
                            co: airQualityData.current?.carbon_monoxide || null,
                            no2: airQualityData.current?.nitrogen_dioxide || null,
                            so2: airQualityData.current?.sulphur_dioxide || null,
                            o3: airQualityData.current?.ozone || null
                        } : null,
                        // Add pollen data to current weather (Europe only)
                        pollen: pollenData ? {
                            alder: pollenData.current?.alder || null,
                            birch: pollenData.current?.birch || null,
                            grass: pollenData.current?.grass || null,
                            mugwort: pollenData.current?.mugwort || null,
                            olive: pollenData.current?.olive || null,
                            ragweed: pollenData.current?.ragweed || null
                        } : null
                    },
                    hourly: {
                        ...weatherDataResult.hourly,
                        // Add air quality hourly data
                        air_quality: airQualityData ? {
                            pm10: airQualityData.hourly?.pm10 || [],
                            pm2_5: airQualityData.hourly?.pm2_5 || [],
                            carbon_monoxide: airQualityData.hourly?.carbon_monoxide || [],
                            nitrogen_dioxide: airQualityData.hourly?.nitrogen_dioxide || [],
                            sulphur_dioxide: airQualityData.hourly?.sulphur_dioxide || [],
                            ozone: airQualityData.hourly?.ozone || [],
                            us_aqi: airQualityData.hourly?.us_aqi || []
                        } : null,
                        // Add pollen hourly data (Europe only)
                        pollen: pollenData ? {
                            alder: pollenData.hourly?.alder || [],
                            birch: pollenData.hourly?.birch || [],
                            grass: pollenData.hourly?.grass || [],
                            mugwort: pollenData.hourly?.mugwort || [],
                            olive: pollenData.hourly?.olive || [],
                            ragweed: pollenData.hourly?.ragweed || []
                        } : null
                    }
                };

                // Save the current weather as last viewed
                saveLastViewedWeatherToStorage(weatherData.value);
            } catch (error) {
                console.error('Fehler beim Abrufen der Wetterdaten:', error);
                alert('Fehler beim Abrufen der Wetterdaten. Bitte erneut versuchen.');
            }
        };

        const saveCurrentWeather = () => {
            if (!weatherData.value) return;

            const existingIndex = searchHistory.value.findIndex(item =>
                item.name === weatherData.value.name ||
                (Math.abs(item.coords.lat - weatherData.value.coords.lat) < 0.05 &&
                    Math.abs(item.coords.lng - weatherData.value.coords.lng) < 0.05)
            );

            if (existingIndex !== -1) {
                searchHistory.value.splice(existingIndex, 1);
            }

            searchHistory.value.unshift({
                id: weatherData.value.id,
                name: weatherData.value.name,
                fullName: weatherData.value.fullName,
                coords: weatherData.value.coords,
                current: weatherData.value.current
            });

            if (searchHistory.value.length > 5) {
                searchHistory.value = searchHistory.value.slice(0, 5);
            }

            saveSearchHistoryToStorage();
        };

        const loadHistoryItem = (item) => {
            currentCoords.value = item.coords;
            getWeatherDataFromAPI(item.coords.lat, item.coords.lng, {
                cityName: item.name,
                fullName: item.fullName
            });
            // This will automatically save as last viewed through getWeatherDataFromAPI
        };

        const removeHistoryItem = (id, event) => {
            if (event) event.stopPropagation();
            searchHistory.value = searchHistory.value.filter(item => item.id !== id);
            saveSearchHistoryToStorage();
        };

        // Location detection functions
        const checkFirstVisitAndRequestLocation = async () => {
            if (isFirstVisit()) {
                await requestLocationPermission();
            }
        };

        const requestLocationPermission = async () => {
            try {
                const coords = await requestGeolocation();
                if (coords) {
                    currentCoords.value = coords;
                    const cityInfo = await getCityName(coords.lat, coords.lng);
                    if (cityInfo) {
                            await getWeatherDataFromAPI(coords.lat, coords.lng, cityInfo);
                        saveCurrentLocationToHistoryLocal(coords, cityInfo);
                    }
                } else {
                    console.log('Geolocation not supported or denied, falling back to IP location');
                    await getLocationFromIPUtil();
                }
            } catch (error) {
                console.log('Location permission denied or error:', error);
                await getLocationFromIPUtil();
            }
        };

        const getLocationFromIPUtil = async () => {
            try {
                const result = await getLocationFromIP();
                if (result) {
                    currentCoords.value = result.coords;
                    await getWeatherDataFromAPI(result.coords.lat, result.coords.lng, result.cityInfo);
                    saveCurrentLocationToHistoryLocal(result.coords, result.cityInfo, true); // true indicates IP-based
                }
            } catch (error) {
                console.error('Failed to get location from IP:', error);
                // Keep default Frankfurt location if all else fails
            }
        };

        const saveCurrentLocationToHistoryLocal = (coords, cityInfo, isIPBased = false) => {
            const locationName = isIPBased ? 'Current Location (Approximate)' : 'Current Location';

            // Remove any existing current location entries
            searchHistory.value = searchHistory.value.filter(item =>
                !item.name.includes('Current Location')
            );

            if (weatherData.value) {
                const currentLocationEntry = {
                    id: 'current-location',
                    name: locationName,
                    fullName: cityInfo.fullName,
                    coords: coords,
                    current: weatherData.value.current,
                    isCurrentLocation: true,
                    isIPBased: isIPBased
                };

                // Add current location as first item
                searchHistory.value.unshift(currentLocationEntry);

                // Keep only 6 items total (including current location)
                if (searchHistory.value.length > 6) {
                    searchHistory.value = searchHistory.value.slice(0, 6);
                }

                saveSearchHistoryToStorage();
            }
        };



        return {
            isLoading,
            weatherData,
            searchHistory,
            currentCoords,
            useImperialUnits,
            toggleUnits,
            formatTempC,
            formatTempF,
            searchLocation,
            handleMapLocationSelected,
            saveCurrentWeather,
            loadHistoryItem,
            removeHistoryItem,
            requestLocationPermission,
            saveLastViewedWeather: saveLastViewedWeatherToStorage,
            loadLastViewedWeather: loadLastViewedWeatherFromStorage
        };
    }
};
