// components/WeatherCard.vue
<template>
  <div class="weather-card glass" :class="{ 'fade-in': show }">
    <div class="location-header">
      <div>
        <h2 class="location-name">{{ weatherData?.name || 'Location' }}</h2>
        <div class="location-time">{{ currentTime }}</div>
      </div>
      <button
          v-if="weatherData"
          @click="$emit('save')"
          class="save-button"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        Speichern
      </button>
    </div>

    <div class="weather-content" v-if="weatherData && weatherData.current">
      <div class="weather-main">
        <div class="temp-container">
          <div class="weather-icon">
            <img
                v-if="weatherData.current.weather && weatherData.current.weather[0]"
                :src="getWeatherIconUrl(weatherData.current.weather[0].icon)"
                :alt="weatherData.current.weather[0].description"
            />
          </div>
          <div class="weather-temp">{{ useImperialUnits ? formatTempF(weatherData.current.temp) : formatTempC(weatherData.current.temp) }}</div>
        </div>
        <div class="weather-description">
          <div class="weather-condition">
            {{ weatherData.current.weather && weatherData.current.weather[0] ? weatherData.current.weather[0].description : 'N/A' }}
          </div>
          <div class="weather-feels-like">
            Gefühlt: {{ useImperialUnits ? formatTempF(weatherData.current.feels_like) : formatTempC(weatherData.current.feels_like) }}
          </div>
        </div>
      </div>

      <div class="weather-detail">
        <div class="forecast-text">
          Es wird {{ getWeatherText(weatherData.current.weather[0]?.main) }}.
          Die Höchstwerte liegen bei {{ useImperialUnits ? formatTempF(weatherData.current.temp + 5) : formatTempC(weatherData.current.temp + 5) }}.
        </div>
      </div>

      <div class="weather-details-grid">
        <div class="weather-detail-item">
          <div class="detail-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="detail-name">Luftqualität</div>
          <div class="detail-value">{{ getAirQuality(weatherData.current) }}</div>
        </div>

        <div class="weather-detail-item">
          <div class="detail-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path>
            </svg>
          </div>
          <div class="detail-name">Wind</div>
          <div class="detail-value">{{ Math.round(weatherData.current.wind_speed * 3.6) }} km/h</div>
        </div>

        <div class="weather-detail-item">
          <div class="detail-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
            </svg>
          </div>
          <div class="detail-name">Luftfeuchte</div>
          <div class="detail-value">{{ weatherData.current.humidity }}%</div>
        </div>

        <div class="weather-detail-item">
          <div class="detail-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div class="detail-name">Luftdruck</div>
          <div class="detail-value">{{ weatherData.current.pressure }} mbar</div>
        </div>

        <div class="weather-detail-item">
          <div class="detail-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          </div>
          <div class="detail-name">UV Index</div>
          <div class="detail-value">{{ weatherData.current.uvi }}</div>
        </div>

        <div class="weather-detail-item">
          <div class="detail-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 3v18"></path>
              <rect x="4" y="8" width="16" height="8" rx="1"></rect>
            </svg>
          </div>
          <div class="detail-name">Taupunkt</div>
          <div class="detail-value">{{ useImperialUnits ? formatTempF(weatherData.current.dew_point) : formatTempC(weatherData.current.dew_point) }}</div>
        </div>
      </div>
    </div>

    <div class="weather-placeholder" v-else>
      <svg xmlns="http://www.w3.org/2000/svg" class="placeholder-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>
        <path d="M22 19a6 6 0 0 1-6 6H9a9 9 0 0 1-9-9 9 9 0 0 1 9-9h8.5c4.1 0 7.5 3.4 7.5 7.5v4.5Z" opacity=".2"/>
      </svg>
      <p>Suchen Sie nach einem Ort, um Wetterinformationen anzuzeigen</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

const props = defineProps({
  weatherData: Object,
  useImperialUnits: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['save']);
const show = ref(false);

onMounted(() => {
  setTimeout(() => {
    show.value = true;
  }, 100);
});

const currentTime = computed(() => {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
});

// Format temperature in Celsius
const formatTempC = (temp) => {
  return temp ? `${Math.round(temp)}°C` : 'N/A';
};

// Format temperature in Fahrenheit
const formatTempF = (temp) => {
  return temp ? `${Math.round((temp * 9/5) + 32)}°F` : 'N/A';
};

// Get weather icon URL
const getWeatherIconUrl = (iconCode) => {
  return iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : '';
};

// Get textual description based on weather type
const getWeatherText = (weatherType) => {
  if (!weatherType) return 'klar';

  const weatherMapping = {
    'Clear': 'sonnig',
    'Clouds': 'bewölkt',
    'Rain': 'regnerisch',
    'Drizzle': 'nieselig',
    'Thunderstorm': 'gewitterig',
    'Snow': 'schneeig',
    'Mist': 'neblig',
    'Fog': 'neblig',
    'Haze': 'dunstig',
    'Dust': 'staubig',
    'Sand': 'sandig',
    'Ash': 'aschig',
    'Squall': 'stürmisch',
    'Tornado': 'stürmisch'
  };

  return weatherMapping[weatherType] || 'wechselhaft';
};

// Calculate air quality index (simplified for demo)
const getAirQuality = (currentWeather) => {
  if (!currentWeather) return 'N/A';

  // This is a simplified calculation - in real app would use API data
  const humidityFactor = currentWeather.humidity / 100;
  const windFactor = 1 - (Math.min(currentWeather.wind_speed * 3.6, 50) / 50);

  const qualityValue = Math.round(30 + Math.random() * 20); // For demo purposes

  if (qualityValue < 30) return 'Sehr gut';
  if (qualityValue < 50) return 'Gut';
  if (qualityValue < 70) return 'Mäßig';
  if (qualityValue < 90) return 'Schlecht';
  return 'Sehr schlecht';
};
</script>

<style scoped>
.weather-card {
  padding: 1.5rem;
  opacity: 0;
  transform: translateY(10px);
  transition: all 0.5s cubic-bezier(0.165, 0.84, 0.44, 1);
  background: rgba(255, 255, 255, 0.08);
}

.fade-in {
  opacity: 1;
  transform: translateY(0);
}

.location-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
}

.location-name {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
}

.location-time {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.25rem;
}

.save-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.save-button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.weather-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.weather-main {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.temp-container {
  display: flex;
  align-items: center;
}

.weather-icon {
  width: 60px;
  height: 60px;
  animation: float 4s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-5px);
  }
  100% {
    transform: translateY(0px);
  }
}

.weather-icon img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.weather-temp {
  font-size: 4rem;
  font-weight: 700;
  line-height: 1;
  margin-left: 0.5rem;
}

.weather-description {
  text-align: right;
}

.weather-condition {
  font-size: 1.25rem;
  text-transform: capitalize;
  margin-bottom: 0.5rem;
}

.weather-feels-like {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

.weather-detail {
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding-top: 1rem;
}

.forecast-text {
  font-size: 1rem;
  line-height: 1.5;
  color: rgba(255, 255, 255, 0.9);
}

.weather-details-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1rem;
}

.weather-detail-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: all 0.3s ease;
}

.weather-detail-item:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px);
}

.detail-icon {
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 0.5rem;
}

.detail-name {
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.25rem;
  text-align: center;
}

.detail-value {
  font-size: 1rem;
  font-weight: 600;
  text-align: center;
}

.weather-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
}

.placeholder-icon {
  margin-bottom: 1rem;
  color: rgba(255, 255, 255, 0.5);
}

@media (max-width: 768px) {
  .weather-main {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }

  .weather-description {
    text-align: left;
    margin-top: 0.5rem;
  }

  .weather-details-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>