import { ref, onMounted } from 'vue';
import Cookies from 'js-cookie';
import SearchBar from "~/components/SearchBar/SearchBar.vue";
import UnitsToggle from "~/components/UnitsToggle/UnitsToggle.vue";
import SavedLocations from "~/components/SavedLocations/SavedLocations.vue";
import WeatherCard from "~/components/WeatherCard/WeatherCard.vue";
import WeatherMap from "~/components/WeatherMap/WeatherMap.vue";
import HourlyForecast from "~/components/HourlyForecast/HourlyForecast.vue";
import { useLocationStore } from '@/stores/LocationStore'


export default {
    components: {WeatherMap, WeatherCard, SavedLocations, UnitsToggle, SearchBar, HourlyForecast},
    setup() {
        const isLoading = ref(false);
        const weatherData = ref(null);
        const searchHistory = ref([]);
        const currentCoords = ref({ lat: 50.110644, lng: 8.68 }); // Default to Frankfurt
        const useImperialUnits = ref(false);
        const locationStore = useLocationStore()

        onMounted(() => {
            loadSearchHistory();
            if (typeof window !== 'undefined') {
                const savedUnits = localStorage.getItem('weatherAppUnits');
                if (savedUnits) {
                    useImperialUnits.value = savedUnits === 'imperial';
                }

                // Load last viewed weather location first
                loadLastViewedWeather();

                // Check for first visit and request location (only if no last viewed weather)
                if (!weatherData.value) {
                    checkFirstVisitAndRequestLocation();
                }
            }
        });

        const toggleUnits = (imperial) => {
            useImperialUnits.value = imperial;
            if (typeof window !== 'undefined') {
                localStorage.setItem('weatherAppUnits', imperial ? 'imperial' : 'metric');
            }
        };

        const loadSearchHistory = () => {
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

        const saveSearchHistory = () => {
            Cookies.set('weatherSearchHistory', JSON.stringify(searchHistory.value), { expires: 30 });
        };

        const saveLastViewedWeather = (weather) => {
            if (typeof window !== 'undefined' && weather) {
                const lastViewed = {
                    weatherData: weather,
                    coords: currentCoords.value,
                    timestamp: Date.now()
                };
                localStorage.setItem('weatherAppLastViewed', JSON.stringify(lastViewed));
            }
        };

        const loadLastViewedWeather = () => {
            if (typeof window !== 'undefined') {
                const saved = localStorage.getItem('weatherAppLastViewed');
                if (saved) {
                    try {
                        const lastViewed = JSON.parse(saved);
                        // Check if the saved data is not too old (max 1 hour)
                        const oneHour = 60 * 60 * 1000;
                        if (Date.now() - lastViewed.timestamp < oneHour) {
                            weatherData.value = lastViewed.weatherData;
                            currentCoords.value = lastViewed.coords;
                            console.log('Loaded last viewed weather:', lastViewed.weatherData.name);
                        } else {
                            // Remove old data
                            localStorage.removeItem('weatherAppLastViewed');
                        }
                    } catch (error) {
                        console.error('Error loading last viewed weather:', error);
                        localStorage.removeItem('weatherAppLastViewed');
                    }
                }
            }
        };

        const formatTempC = (temp) => temp ? `${Math.round(temp)}°C` : 'N/A';
        const formatTempF = (temp) => temp ? `${Math.round((temp * 9 / 5) + 32)}°F` : 'N/A';

        const searchLocation = async (query) => {
            if (!query.trim()) return;

            isLoading.value = true;
            try {

                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`);
                const data = await response.json();

                if (data && data.length > 0) {
                    const location = data[0];
                    const address = location.address;

                    // Use improved location name resolution for search results too
                    // Priority: village > municipality > city > town > suburb > neighbourhood > hamlet
                    const city = address.village ||
                               address.municipality ||
                               address.city ||
                               address.town ||
                               address.suburb ||
                               address.neighbourhood ||
                               address.hamlet ||
                               location.display_name.split(',')[0];

                    currentCoords.value = {
                        lat: parseFloat(location.lat),
                        lng: parseFloat(location.lon)
                    };

                    // Create a more descriptive full name
                    const region = address.state || address.county || address.country;
                    const fullName = region ? `${city}, ${region}` : city;

                    await getWeatherData(currentCoords.value.lat, currentCoords.value.lng, {
                        cityName: city,
                        fullName: fullName
                    });
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
                getWeatherData(coords.lat, coords.lng, cityInfo);
            }
        };

        const getCityName = async (lat, lng) => {
            try {
                // Use higher zoom level (18) for more precise location detection
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
                const data = await response.json();

                console.log('Reverse geocoding result:', data);

                // Improved priority order for more specific location names
                // Priority: village > municipality > city > town > suburb > neighbourhood > hamlet > county
                const address = data.address;
                const city = address.village ||
                           address.municipality ||
                           address.city ||
                           address.town ||
                           address.suburb ||
                           address.neighbourhood ||
                           address.hamlet ||
                           address.county ||
                           address.state ||
                           'Unbekannter Ort';

                // For the full name, try to get a more descriptive location
                const region = address.state || address.county || address.country;
                const fullName = region ? `${city}, ${region}` : city;

                return {
                    cityName: city,
                    fullName: fullName
                };
            } catch (error) {
                console.error('Fehler beim Abrufen des Ortsnamens:', error);
                return null;
            }
        };

        const getWeatherData = async (lat, lng, locationInfo) => {
            try {
                // Open-Meteo API - comprehensive weather data with extended forecast
                const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,relative_humidity_2m,dew_point_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,pressure_msl,surface_pressure,cloud_cover,visibility,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,is_day&daily=temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max&timezone=auto&forecast_days=8&past_days=1`;

                // Air quality API from Open-Meteo with extended forecast
                const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&timezone=auto&forecast_days=8&past_days=1`;

                const [weatherRes, airQualityRes] = await Promise.all([
                    fetch(weatherUrl),
                    fetch(airQualityUrl)
                ]);

                const weatherData_api = await weatherRes.json();
                const airQualityData = await airQualityRes.json();

                console.log('Weather Data:', weatherData_api);
                console.log('Air Quality Data:', airQualityData);

                if (weatherRes.ok) {
                    // Transform Open-Meteo data to match our component structure
                    const current = weatherData_api.current;
                    const hourly = weatherData_api.hourly;
                    const daily = weatherData_api.daily;

                    weatherData.value = {
                        name: locationInfo.cityName,
                        fullName: locationInfo.fullName,
                        coords: { lat, lng },
                        id: Date.now(),
                        current: {
                            temp: current.temperature_2m,
                            feels_like: current.apparent_temperature,
                            humidity: current.relative_humidity_2m,
                            pressure: current.pressure_msl,
                            wind_speed: current.wind_speed_10m / 3.6, // Convert km/h to m/s for consistency
                            wind_deg: current.wind_direction_10m,
                            wind_gust: current.wind_gusts_10m,
                            visibility: hourly.visibility[0] / 1000, // Convert m to km
                            dew_point: hourly.dew_point_2m[0],
                            cloud_cover: current.cloud_cover,
                            weather: [{
                                id: current.weather_code,
                                main: getWeatherConditionFromCode(current.weather_code),
                                description: getWeatherDescriptionFromCode(current.weather_code),
                                icon: getWeatherIcon(current.weather_code, current.is_day)
                            }],
                            // Air quality data
                            air_quality: {
                                aqi: airQualityData.current?.us_aqi || null,
                                pm10: airQualityData.current?.pm10 || null,
                                pm2_5: airQualityData.current?.pm2_5 || null,
                                co: airQualityData.current?.carbon_monoxide || null,
                                no2: airQualityData.current?.nitrogen_dioxide || null,
                                so2: airQualityData.current?.sulphur_dioxide || null,
                                o3: airQualityData.current?.ozone || null
                            }
                        },
                        hourly: {
                            time: hourly.time,
                            temperature_2m: hourly.temperature_2m,
                            relative_humidity_2m: hourly.relative_humidity_2m,
                            dew_point_2m: hourly.dew_point_2m,
                            apparent_temperature: hourly.apparent_temperature,
                            precipitation_probability: hourly.precipitation_probability,
                            precipitation: hourly.precipitation,
                            weather_code: hourly.weather_code,
                            pressure_msl: hourly.pressure_msl,
                            surface_pressure: hourly.surface_pressure,
                            cloud_cover: hourly.cloud_cover,
                            visibility: hourly.visibility,
                            wind_speed_10m: hourly.wind_speed_10m,
                            wind_direction_10m: hourly.wind_direction_10m,
                            wind_gusts_10m: hourly.wind_gusts_10m,
                            uv_index: hourly.uv_index,
                            is_day: hourly.is_day,
                            // Air quality hourly data
                            air_quality: {
                                pm10: airQualityData.hourly?.pm10 || [],
                                pm2_5: airQualityData.hourly?.pm2_5 || [],
                                carbon_monoxide: airQualityData.hourly?.carbon_monoxide || [],
                                nitrogen_dioxide: airQualityData.hourly?.nitrogen_dioxide || [],
                                sulphur_dioxide: airQualityData.hourly?.sulphur_dioxide || [],
                                ozone: airQualityData.hourly?.ozone || [],
                                us_aqi: airQualityData.hourly?.us_aqi || []
                            }
                        },
                        daily: {
                            time: daily.time,
                            temperature_2m_max: daily.temperature_2m_max,
                            temperature_2m_min: daily.temperature_2m_min,
                            sunrise: daily.sunrise,
                            sunset: daily.sunset,
                            precipitation_sum: daily.precipitation_sum,
                            precipitation_probability_max: daily.precipitation_probability_max
                        }
                    };

                    // Save the current weather as last viewed
                    saveLastViewedWeather(weatherData.value);
                }
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

            saveSearchHistory();
        };

        const loadHistoryItem = (item) => {
            currentCoords.value = item.coords;
            getWeatherData(item.coords.lat, item.coords.lng, {
                cityName: item.name,
                fullName: item.fullName
            });
            // This will automatically save as last viewed through getWeatherData
        };

        const removeHistoryItem = (id, event) => {
            if (event) event.stopPropagation();
            searchHistory.value = searchHistory.value.filter(item => item.id !== id);
            saveSearchHistory();
        };

        // Location detection functions
        const checkFirstVisitAndRequestLocation = async () => {
            const hasVisited = localStorage.getItem('weatherAppVisited');
            if (!hasVisited) {
                localStorage.setItem('weatherAppVisited', 'true');
                await requestLocationPermission();
            }
        };

        const requestLocationPermission = async () => {
            if (!navigator.geolocation) {
                console.log('Geolocation not supported, falling back to IP location');
                await getLocationFromIP();
                return;
            }

            try {
                const position = await getCurrentLocation();
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                currentCoords.value = coords;
                const cityInfo = await getCityName(coords.lat, coords.lng);
                if (cityInfo) {
                    await getWeatherData(coords.lat, coords.lng, cityInfo);

                    if (weatherData.value) {
                        console.log("Speichere aktuellen Standort im LocationStore");
                        locationStore.updateCurrentLocation({
                            ...weatherData.value,
                            isCurrentLocation: true
                        });
                    }
                }
            } catch (error) {
                console.log('Location permission denied or error:', error);
                await getLocationFromIP();
            }
        };

        const getCurrentLocation = () => {
            return new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(
                    resolve,
                    reject,
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 300000 // 5 minutes
                    }
                );
            });
        };

        const getLocationFromIP = async () => {
            try {
                // Using ipapi.co as it's free and doesn't require API key
                const response = await fetch('https://ipapi.co/json/');
                const data = await response.json();

                if (data.latitude && data.longitude) {
                    const coords = {
                        lat: parseFloat(data.latitude),
                        lng: parseFloat(data.longitude)
                    };

                    currentCoords.value = coords;
                    const cityInfo = {
                        cityName: data.city || data.region || 'Your Location',
                        fullName: `${data.city || data.region}, ${data.country_name || ''}`
                    };

                    await getWeatherData(coords.lat, coords.lng, cityInfo);

                    if (weatherData.value) {
                        console.log("Speichere IP-basierten Standort im LocationStore");
                        locationStore.updateCurrentLocation({
                            ...weatherData.value,
                            isCurrentLocation: true,
                            isIPBased: true
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to get location from IP:', error);
                // Keep default Frankfurt location if all else fails
            }
        };

        const handleRefreshLocation = async () => {
            if (navigator.geolocation) {
                try {
                    const position = await getCurrentLocation();
                    const coords = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };

                    currentCoords.value = coords;
                    const cityInfo = await getCityName(coords.lat, coords.lng);

                    if (cityInfo) {
                        await getWeatherData(coords.lat, coords.lng, cityInfo);

                        if (weatherData.value) {
                            console.log("Aktualisiere Standort im LocationStore");
                            locationStore.updateCurrentLocation({
                                ...weatherData.value,
                                isCurrentLocation: true
                            });
                        }
                    }
                } catch (error) {
                    console.log('Location permission denied or error:', error);
                    await getLocationFromIP();
                }
            } else {
                await getLocationFromIP();
            }
        };


        const saveCurrentLocationToHistory = (coords, cityInfo, isIPBased = false) => {
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

                saveSearchHistory();

                locationStore.updateCurrentLocation({
                    ...weatherData.value,
                    isCurrentLocation: true,
                    isIPBased: isIPBased
                });

            }
        };

        // Helper functions for Open-Meteo weather codes
        const getWeatherConditionFromCode = (code) => {
            const weatherCodes = {
                0: 'Clear',
                1: 'Clear', 2: 'Clear', 3: 'Clear',
                45: 'Fog', 48: 'Fog',
                51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
                56: 'Drizzle', 57: 'Drizzle',
                61: 'Rain', 63: 'Rain', 65: 'Rain',
                66: 'Rain', 67: 'Rain',
                71: 'Snow', 73: 'Snow', 75: 'Snow',
                77: 'Snow', 80: 'Rain', 81: 'Rain', 82: 'Rain',
                85: 'Snow', 86: 'Snow',
                95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm'
            };

            if (code >= 1 && code <= 3) return 'Clouds';
            return weatherCodes[code] || 'Clear';
        };

        const getWeatherDescriptionFromCode = (code) => {
            const descriptions = {
                0: 'clear sky',
                1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
                45: 'fog', 48: 'depositing rime fog',
                51: 'light drizzle', 53: 'moderate drizzle', 55: 'dense drizzle',
                56: 'light freezing drizzle', 57: 'dense freezing drizzle',
                61: 'slight rain', 63: 'moderate rain', 65: 'heavy rain',
                66: 'light freezing rain', 67: 'heavy freezing rain',
                71: 'slight snow fall', 73: 'moderate snow fall', 75: 'heavy snow fall',
                77: 'snow grains', 80: 'slight rain showers', 81: 'moderate rain showers', 82: 'violent rain showers',
                85: 'slight snow showers', 86: 'heavy snow showers',
                95: 'thunderstorm', 96: 'thunderstorm with slight hail', 99: 'thunderstorm with heavy hail'
            };
            return descriptions[code] || 'clear sky';
        };

        const getWeatherIcon = (code, isDay) => {
            const iconMap = {
                0: isDay ? '01d' : '01n', // clear sky
                1: isDay ? '02d' : '02n', // mainly clear
                2: isDay ? '03d' : '03n', // partly cloudy
                3: '04d', // overcast
                45: '50d', // fog
                48: '50d', // depositing rime fog
                51: '09d', // light drizzle
                53: '09d', // moderate drizzle
                55: '09d', // dense drizzle
                56: '09d', // light freezing drizzle
                57: '09d', // dense freezing drizzle
                61: '10d', // slight rain
                63: '10d', // moderate rain
                65: '10d', // heavy rain
                66: '13d', // light freezing rain
                67: '13d', // heavy freezing rain
                71: '13d', // slight snow fall
                73: '13d', // moderate snow fall
                75: '13d', // heavy snow fall
                77: '13d', // snow grains
                80: '09d', // slight rain showers
                81: '09d', // moderate rain showers
                82: '09d', // violent rain showers
                85: '13d', // slight snow showers
                86: '13d', // heavy snow showers
                95: '11d', // thunderstorm
                96: '11d', // thunderstorm with slight hail
                99: '11d'  // thunderstorm with heavy hail
            };
            return iconMap[code] || (isDay ? '01d' : '01n');
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
            saveLastViewedWeather,
            loadLastViewedWeather,
            handleRefreshLocation
        };
    }
};
