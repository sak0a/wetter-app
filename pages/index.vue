// pages/index.vue
<template>
  <div class="weather-app-container">
    <div class="weather-app-content">
      <!-- Top Section with Search -->
      <div class="search-section">
        <SearchBar
            :loading="isLoading"
            @search="searchLocation"
        />

        <div class="current-location">
          <div v-if="weatherData" class="location-pill">
            <span class="location-name">{{ weatherData.name }}</span>
            <span class="location-temp">{{ useImperialUnits ? formatTempF(weatherData.current?.temp) : formatTempC(weatherData.current?.temp) }}</span>
          </div>
          <UnitsToggle
              :useImperialUnits="useImperialUnits"
              @update:units="toggleUnits"
          />
        </div>
      </div>

      <!-- Saved Locations Row -->
      <SavedLocations
          :history="searchHistory"
          :useImperialUnits="useImperialUnits"
          @select="loadHistoryItem"
          @remove="removeHistoryItem"
      />

      <div class="main-content">
        <!-- Weather Information Grid -->
        <div class="weather-grid">
          <div class="weather-card-container">
            <WeatherCard
                :weatherData="weatherData"
                :useImperialUnits="useImperialUnits"
                @save="saveCurrentWeather"
            />
          </div>

          <div class="map-container">
            <WeatherMap
                :currentCoords="currentCoords"
                @location-selected="handleMapLocationSelected"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Cookies from 'js-cookie';
import SearchBar from '~/components/SearchBar.vue';
import WeatherCard from '~/components/WeatherCard.vue';
import WeatherMap from '~/components/WeatherMap.vue';
import SavedLocations from '~/components/SavedLocations.vue';
import UnitsToggle from '~/components/UnitsToggle.vue';

// State variables
const isLoading = ref(false);
const weatherData = ref(null);
const searchHistory = ref([]);
const currentCoords = ref({ lat: 51.505, lng: -0.09 }); // Default to London
const apiKey = ref('2c4e17f310350ace6cb874f4457c2573'); // Your OpenWeatherMap API key
const useImperialUnits = ref(false);

// Initialize app
onMounted(() => {
  // Load search history from cookies
  loadSearchHistory();

  // Load units preference from localStorage
  if (typeof window !== 'undefined') {
    const savedUnits = localStorage.getItem('weatherAppUnits');
    if (savedUnits) {
      useImperialUnits.value = savedUnits === 'imperial';
    }
  }
});

// Toggle temperature units
const toggleUnits = (imperial) => {
  useImperialUnits.value = imperial;

  // Save preference to localStorage
  if (typeof window !== 'undefined') {
    localStorage.setItem('weatherAppUnits', imperial ? 'imperial' : 'metric');
  }
};

// Load search history from cookies
const loadSearchHistory = () => {
  const historyCookie = Cookies.get('weatherSearchHistory');
  if (historyCookie) {
    try {
      searchHistory.value = JSON.parse(historyCookie);
    } catch (e) {
      console.error('Error parsing search history cookie', e);
      searchHistory.value = [];
    }
  }
};

// Save search history to cookies
const saveSearchHistory = () => {
  Cookies.set('weatherSearchHistory', JSON.stringify(searchHistory.value), { expires: 30 });
};

// Format temperature in Celsius
const formatTempC = (temp) => {
  return temp ? `${Math.round(temp)}°C` : 'N/A';
};

// Format temperature in Fahrenheit
const formatTempF = (temp) => {
  return temp ? `${Math.round((temp * 9/5) + 32)}°F` : 'N/A';
};

// Search for location
const searchLocation = async (query) => {
  if (!query.trim()) return;

  isLoading.value = true;
  try {
    // Using OpenStreetMap's Nominatim API for geocoding
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`);
    const data = await response.json();

    if (data && data.length > 0) {
      const location = data[0];

      // Extract city name from address data
      const address = location.address;
      const city = address.city ||
          address.town ||
          address.village ||
          address.county ||
          address.state ||
          location.display_name.split(',')[0];

      currentCoords.value = {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lon)
      };

      // Get weather data for the location
      await getWeatherData(
          currentCoords.value.lat,
          currentCoords.value.lng,
          {
            cityName: city,
            fullName: `${city}, ${address.country || ''}`
          }
      );
    } else {
      alert('Stadt nicht gefunden. Bitte versuchen Sie einen anderen Suchbegriff.');
    }
  } catch (error) {
    console.error('Error searching for location:', error);
    alert('Fehler bei der Suche nach dem Ort. Bitte versuchen Sie es erneut.');
  } finally {
    isLoading.value = false;
  }
};

// Handle location selected from map
const handleMapLocationSelected = async (coords) => {
  currentCoords.value = coords;
  const cityInfo = await getCityName(coords.lat, coords.lng);
  if (cityInfo) {
    getWeatherData(coords.lat, coords.lng, cityInfo);
  }
};

// Get only city name from coordinates using reverse geocoding
const getCityName = async (lat, lng) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`);
    const data = await response.json();

    // Extract city name from address data
    const city = data.address.city ||
        data.address.town ||
        data.address.village ||
        data.address.county ||
        data.address.state ||
        'Unknown Location';

    return {
      cityName: city,
      fullName: `${city}, ${data.address.country || ''}`
    };
  } catch (error) {
    console.error('Error getting city name:', error);
    return null;
  }
};

// Get weather data from OpenWeatherMap API
const getWeatherData = async (lat, lng, locationInfo) => {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&exclude=hourly,daily&appid=${apiKey.value}&units=metric`);
    const data = await response.json();

    if (data) {
      weatherData.value = {
        ...data,
        name: locationInfo.cityName,
        fullName: locationInfo.fullName,
        coords: { lat, lng },
        id: Date.now()
      };
    }
  } catch (error) {
    console.error('Error fetching weather data:', error);
    alert('Fehler beim Abrufen der Wetterdaten. Bitte versuchen Sie es erneut.');
  }
};

// Save current weather data to history
const saveCurrentWeather = () => {
  if (!weatherData.value) return;

  // Check if location already exists in history
  const existingIndex = searchHistory.value.findIndex(item =>
      item.name === weatherData.value.name ||
      (Math.abs(item.coords.lat - weatherData.value.coords.lat) < 0.05 &&
          Math.abs(item.coords.lng - weatherData.value.coords.lng) < 0.05)
  );

  if (existingIndex !== -1) {
    // Remove existing entry
    searchHistory.value.splice(existingIndex, 1);
  }

  // Add new entry
  searchHistory.value.unshift({
    id: weatherData.value.id,
    name: weatherData.value.name,
    fullName: weatherData.value.fullName,
    coords: weatherData.value.coords,
    current: weatherData.value.current
  });

  // Keep only the last 5 entries
  if (searchHistory.value.length > 5) {
    searchHistory.value = searchHistory.value.slice(0, 5);
  }

  // Save updated history to cookies
  saveSearchHistory();
};

// Load weather data for a history item
const loadHistoryItem = (item) => {
  currentCoords.value = item.coords;
  getWeatherData(item.coords.lat, item.coords.lng, { cityName: item.name, fullName: item.fullName });
};

// Remove a history item
const removeHistoryItem = (id, event) => {
  if (event) event.stopPropagation(); // Prevent triggering loadHistoryItem
  searchHistory.value = searchHistory.value.filter(item => item.id !== id);
  saveSearchHistory();
};
</script>

<style>
.weather-app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.weather-app-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.search-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-top: 1rem;
}

.current-location {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-top: 0.5rem;
}

.location-pill {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(12px);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.location-name {
  font-weight: 500;
}

.location-temp {
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.main-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.weather-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  min-height: 400px;
}

.weather-card-container {
  min-height: 400px;
}

.map-container {
  height: 400px;
}

@media (max-width: 768px) {
  .weather-grid {
    grid-template-columns: 1fr;
  }

  .map-container {
    order: -1;
  }
}
</style>