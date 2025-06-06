import { ref, onMounted } from 'vue';
import Cookies from 'js-cookie';
import SearchBar from "~/components/SearchBar/SearchBar.vue";
import UnitsToggle from "~/components/UnitsToggle/UnitsToggle.vue";
import SavedLocations from "~/components/SavedLocations/SavedLocations.vue";
import WeatherCard from "~/components/WeatherCard/WeatherCard.vue";
import WeatherMap from "~/components/WeatherMap/WeatherMap.vue";

export default {
    components: {WeatherMap, WeatherCard, SavedLocations, UnitsToggle, SearchBar},
    setup() {
        const isLoading = ref(false);
        const weatherData = ref(null);
        const searchHistory = ref([]);
        const currentCoords = ref({ lat: 50.110644, lng: 8.68 }); // Default to London
        const apiKey = ref('2c4e17f310350ace6cb874f4457c2573');
        const useImperialUnits = ref(false);

        onMounted(() => {
            loadSearchHistory();
            if (typeof window !== 'undefined') {
                const savedUnits = localStorage.getItem('weatherAppUnits');
                if (savedUnits) {
                    useImperialUnits.value = savedUnits === 'imperial';
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
                    const city = address.city || address.town || address.village || address.county || address.state || location.display_name.split(',')[0];

                    currentCoords.value = {
                        lat: parseFloat(location.lat),
                        lng: parseFloat(location.lon)
                    };

                    await getWeatherData(currentCoords.value.lat, currentCoords.value.lng, {
                        cityName: city,
                        fullName: `${city}, ${address.country || ''}`
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
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
                const data = await response.json();

                const city = data.address.city || data.address.town || data.address.village || data.address.county || data.address.state || 'Unbekannter Ort';

                return {
                    cityName: city,
                    fullName: `${city}, ${data.address.country || ''}`
                };
            } catch (error) {
                console.error('Fehler beim Abrufen des Ortsnamens:', error);
                return null;
            }
        };

        const getWeatherData = async (lat, lng, locationInfo) => {
            try {
                const oneCallRes  = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&exclude=hourly,daily&appid=${apiKey.value}&units=metric`);
                const oneCallData  = await oneCallRes.json();
console.log(oneCallData);
                const cityRes = await fetch(
                    `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lng}&appid=${apiKey.value}&units=metric`
                );
                const cityData = await cityRes.json();

                if (oneCallRes) {
                    weatherData.value = {
                        ...oneCallData,
                        ...cityData,
                        name: locationInfo.cityName,
                        fullName: locationInfo.fullName,
                        coords: { lat, lng },
                        id: Date.now()
                    };
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
        };

        const removeHistoryItem = (id, event) => {
            if (event) event.stopPropagation();
            searchHistory.value = searchHistory.value.filter(item => item.id !== id);
            saveSearchHistory();
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
            removeHistoryItem
        };
    }
};
