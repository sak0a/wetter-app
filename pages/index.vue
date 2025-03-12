<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Cookies from 'js-cookie'

// State variables
const searchQuery = ref('')
const isLoading = ref(false)
const weatherData = ref(null)
const searchHistory = ref([])
const mapObject = ref(null)
const marker = ref(null)
const apiKey = ref('2c4e17f310350ace6cb874f4457c2573') // Replace with your OpenWeatherMap API key
const currentCoords = ref({ lat: 51.505, lng: -0.09 }) // Default to London
let L = null // Will hold the Leaflet instance

// Initialize Leaflet map
onMounted(() => {
  // Load search history from cookies
  loadSearchHistory()

  // We're in client-side only mode (ssr: false in nuxt.config.ts)
  // so we can safely import Leaflet
  import('leaflet').then((leaflet) => {
    L = leaflet.default

    // Create map instance
    mapObject.value = L.map('map').setView([currentCoords.value.lat, currentCoords.value.lng], 13)

    // Add tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(mapObject.value)

    // Add initial marker
    marker.value = L.marker([currentCoords.value.lat, currentCoords.value.lng]).addTo(mapObject.value)

    // Add click event to map for location selection
    mapObject.value.on('click', (e) => {
      currentCoords.value = { lat: e.latlng.lat, lng: e.latlng.lng }
      updateMarker()
      getLocationName(currentCoords.value.lat, currentCoords.value.lng)
          .then(name => {
            getWeatherData(currentCoords.value.lat, currentCoords.value.lng, name)
          })
    })
  })
})

// Update marker position
const updateMarker = () => {
  if (!mapObject.value || !marker.value || !L) return

  marker.value.setLatLng([currentCoords.value.lat, currentCoords.value.lng])
  mapObject.value.setView([currentCoords.value.lat, currentCoords.value.lng], 13)
}

// Load search history from cookies
const loadSearchHistory = () => {
  const historyCookie = Cookies.get('weatherSearchHistory')
  if (historyCookie) {
    try {
      searchHistory.value = JSON.parse(historyCookie)
    } catch (e) {
      console.error('Error parsing search history cookie', e)
      searchHistory.value = []
    }
  }
}

// Save search history to cookies
const saveSearchHistory = () => {
  Cookies.set('weatherSearchHistory', JSON.stringify(searchHistory.value), { expires: 30 })
}

// Get location name from coordinates using reverse geocoding
const getLocationName = async (lat, lng) => {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
    const data = await response.json()
    return data.display_name || 'Unknown Location'
  } catch (error) {
    console.error('Error getting location name:', error)
    return 'Unknown Location'
  }
}

// Search for location
const searchLocation = async () => {
  if (!searchQuery.value.trim()) return

  isLoading.value = true
  try {
    // Using OpenStreetMap's Nominatim API for geocoding
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery.value)}`)
    const data = await response.json()

    if (data && data.length > 0) {
      const location = data[0]
      currentCoords.value = {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lon)
      }

      // Update map view and marker
      updateMarker()

      // Get weather data for the location
      await getWeatherData(currentCoords.value.lat, currentCoords.value.lng, location.display_name)
    } else {
      alert('Location not found. Please try another search term.')
    }
  } catch (error) {
    console.error('Error searching for location:', error)
    alert('Error searching for location. Please try again.')
  } finally {
    isLoading.value = false
  }
}

// Get weather data from OpenWeatherMap API
const getWeatherData = async (lat, lng, locationName) => {
  try {
    const response = await fetch(`https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lng}&exclude=hourly,daily&appid=${apiKey.value}&units=metric`)
    const data = await response.json()

    if (data) {
      weatherData.value = {
        ...data,
        name: locationName.split(',')[0], // Extract city name from the display name
        fullName: locationName,
        coords: { lat, lng },
        id: Date.now()
      }
    }
  } catch (error) {
    console.error('Error fetching weather data:', error)
    alert('Error fetching weather data. Please try again.')
  }
}

// Save current weather data to history
const saveCurrentWeather = () => {
  if (!weatherData.value) return

  // Check if location already exists in history
  const existingIndex = searchHistory.value.findIndex(item =>
      item.name === weatherData.value.name ||
      (Math.abs(item.coords.lat - weatherData.value.coords.lat) < 0.01 &&
          Math.abs(item.coords.lng - weatherData.value.coords.lng) < 0.01)
  )

  if (existingIndex !== -1) {
    // Remove existing entry
    searchHistory.value.splice(existingIndex, 1)
  }

  // Add new entry
  searchHistory.value.unshift({
    id: weatherData.value.id,
    name: weatherData.value.name,
    fullName: weatherData.value.fullName,
    coords: weatherData.value.coords,
    current: weatherData.value.current
  })

  // Keep only the last 5 entries
  if (searchHistory.value.length > 5) {
    searchHistory.value = searchHistory.value.slice(0, 5)
  }

  // Save updated history to cookies
  saveSearchHistory()
}

// Load weather data for a history item
const loadHistoryItem = (item) => {
  currentCoords.value = item.coords
  updateMarker()
  getWeatherData(item.coords.lat, item.coords.lng, item.fullName)
}

// Remove a history item
const removeHistoryItem = (id, event) => {
  event.stopPropagation() // Prevent triggering loadHistoryItem
  searchHistory.value = searchHistory.value.filter(item => item.id !== id)
  saveSearchHistory()
}

// Format temperature
const formatTemp = (temp) => {
  return temp ? `${Math.round(temp)}°C` : 'N/A'
}

// Get weather icon URL
const getWeatherIconUrl = (iconCode) => {
  return iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : ''
}
</script>

<template>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold text-center mb-8">
      Wetter App
    </h1>

    <!-- Search Section -->
    <div class="mb-6">
      <div class="flex">
        <input
            v-model="searchQuery"
            type="text"
            class="flex-grow px-4 py-2 border border-gray-300 rounded-l focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search for a location..."
            @keyup.enter="searchLocation"
        />
        <button
            @click="searchLocation"
            class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-r focus:outline-none focus:ring-2 focus:ring-blue-500"
            :disabled="isLoading"
        >
          <span v-if="isLoading">Searching...</span>
          <span v-else>Search</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Map Section -->
      <div class="md:col-span-2 h-96 bg-gray-100 rounded shadow-md">
        <div id="map" class="h-full w-full"></div>
      </div>

      <!-- Weather Data Section -->
      <div class="md:col-span-1">
        <div v-if="weatherData" class="bg-white rounded shadow-md overflow-hidden">
          <!-- Weather Card Header -->
          <div class="bg-blue-500 text-white p-4">
            <div class="flex justify-between items-center">
              <div>
                <h2 class="text-xl font-bold">{{ weatherData.name }}</h2>
                <p class="text-sm">{{ new Date().toLocaleDateString() }}</p>
              </div>
              <button
                  @click="saveCurrentWeather"
                  class="bg-white text-blue-600 px-3 py-1 rounded hover:bg-blue-100 transition"
              >
                Save
              </button>
            </div>
          </div>

          <!-- Weather Card Body -->
          <div class="p-4">
            <div v-if="weatherData.current" class="flex flex-col items-center mb-4">
              <img
                  v-if="weatherData.current.weather && weatherData.current.weather[0]"
                  :src="getWeatherIconUrl(weatherData.current.weather[0].icon)"
                  :alt="weatherData.current.weather[0].description"
                  class="w-16 h-16"
              />
              <div class="text-4xl font-bold">{{ formatTemp(weatherData.current.temp) }}</div>
              <div class="text-gray-600 capitalize">
                {{ weatherData.current.weather && weatherData.current.weather[0] ? weatherData.current.weather[0].description : 'N/A' }}
              </div>
            </div>

            <!-- Weather Details -->
            <div class="grid grid-cols-2 gap-2 text-sm">
              <div class="bg-gray-100 p-2 rounded">
                <div class="text-gray-500">Feels Like</div>
                <div>{{ weatherData.current ? formatTemp(weatherData.current.feels_like) : 'N/A' }}</div>
              </div>
              <div class="bg-gray-100 p-2 rounded">
                <div class="text-gray-500">Humidity</div>
                <div>{{ weatherData.current ? `${weatherData.current.humidity}%` : 'N/A' }}</div>
              </div>
              <div class="bg-gray-100 p-2 rounded">
                <div class="text-gray-500">Wind</div>
                <div>{{ weatherData.current ? `${Math.round(weatherData.current.wind_speed * 3.6)} km/h` : 'N/A' }}</div>
              </div>
              <div class="bg-gray-100 p-2 rounded">
                <div class="text-gray-500">Pressure</div>
                <div>{{ weatherData.current ? `${weatherData.current.pressure} hPa` : 'N/A' }}</div>
              </div>
              <div class="bg-gray-100 p-2 rounded">
                <div class="text-gray-500">Visibility</div>
                <div>{{ weatherData.current && weatherData.current.visibility ? `${(weatherData.current.visibility / 1000).toFixed(1)} km` : 'N/A' }}</div>
              </div>
              <div class="bg-gray-100 p-2 rounded">
                <div class="text-gray-500">UV Index</div>
                <div>{{ weatherData.current ? weatherData.current.uvi : 'N/A' }}</div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="bg-white rounded shadow-md p-6 flex flex-col items-center justify-center h-full">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
          </svg>
          <p class="text-gray-500 text-center">Search for a location to view weather information</p>
        </div>
      </div>
    </div>

    <!-- Saved Weather Cards -->
    <div v-if="searchHistory.length > 0" class="mt-8">
      <h2 class="text-2xl font-bold mb-4">Saved Locations</h2>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
            v-for="item in searchHistory"
            :key="item.id"
            class="bg-white rounded shadow-md overflow-hidden"
        >
          <!-- Card Header -->
          <div class="bg-blue-500 text-white p-4">
            <div class="flex justify-between items-center">
              <div>
                <h3 class="text-lg font-bold">{{ item.name }}</h3>
                <p class="text-xs">{{ new Date().toLocaleDateString() }}</p>
              </div>
              <div class="flex gap-2">
                <button
                    @click="loadHistoryItem(item)"
                    class="bg-white text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition"
                >
                  View
                </button>
                <button
                    @click="removeHistoryItem(item.id, $event)"
                    class="bg-white text-red-600 px-2 py-1 rounded hover:bg-red-100 transition"
                >
                  ×
                </button>
              </div>
            </div>
          </div>

          <!-- Card Body -->
          <div class="p-4">
            <div v-if="item.current" class="flex flex-col items-center mb-4">
              <img
                  v-if="item.current.weather && item.current.weather[0]"
                  :src="getWeatherIconUrl(item.current.weather[0].icon)"
                  :alt="item.current.weather[0].description"
                  class="w-12 h-12"
              />
              <div class="text-3xl font-bold">{{ formatTemp(item.current.temp) }}</div>
              <div class="text-sm text-gray-600 capitalize">
                {{ item.current.weather && item.current.weather[0] ? item.current.weather[0].description : 'N/A' }}
              </div>
            </div>

            <!-- Weather Details -->
            <div class="grid grid-cols-2 gap-2 text-xs">
              <div class="bg-gray-100 p-2 rounded">
                <div class="text-gray-500">Feels Like</div>
                <div>{{ item.current ? formatTemp(item.current.feels_like) : 'N/A' }}</div>
              </div>
              <div class="bg-gray-100 p-2 rounded">
                <div class="text-gray-500">Humidity</div>
                <div>{{ item.current ? `${item.current.humidity}%` : 'N/A' }}</div>
              </div>
              <div class="bg-gray-100 p-2 rounded">
                <div class="text-gray-500">Wind</div>
                <div>{{ item.current ? `${Math.round(item.current.wind_speed * 3.6)} km/h` : 'N/A' }}</div>
              </div>
              <div class="bg-gray-100 p-2 rounded">
                <div class="text-gray-500">UV Index</div>
                <div>{{ item.current ? item.current.uvi : 'N/A' }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* Ensure the Leaflet map container has proper dimensions */
#map {
  z-index: 1; /* Ensure map is below dropdowns/popups */
}
</style>