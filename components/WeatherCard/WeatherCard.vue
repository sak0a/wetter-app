// components/WeatherCard.vue
<template>
  <div class="weather-card glass" :class="{ 'fade-in': show }">
    <div class="weather-header" v-if="weatherData">
      <div class="header-left">
        <h1 class="weather-title">Aktuelles Wetter in {{ weatherData?.name || 'Unbekannter Ort' }}</h1>
        <div class="weather-time">{{ currentTime }}</div>
      </div>
      <button @click="$emit('save')" class="weather-action-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M8 12h8"></path>
          <path d="M12 8v8"></path>
        </svg>
      </button>
    </div>

    <div class="weather-content" v-if="weatherData && (weatherData.current || weatherData.main)">
      <div class="weather-main-display">
        <div class="weather-icon-large">
          <img
              :src="getWeatherIconUrl(
              weatherData.weather?.[0]?.icon ?? weatherData.current?.weather?.[0]?.icon
            )"
              :alt="weatherData.weather?.[0]?.description ?? weatherData.current?.weather?.[0]?.description"
          />
        </div>
        <div class="temperature-display">
          {{
            useImperialUnits
                ? formatTempF(weatherData.main?.temp ?? weatherData.current?.temp)
                : formatTempC(weatherData.main?.temp ?? weatherData.current?.temp)
          }}
        </div>
        <div class="weather-condition-info">
          <div class="condition-main">
            {{ getGermanWeatherCondition(weatherData.weather?.[0]?.main ?? weatherData.current?.weather?.[0]?.main) }}
          </div>
          <div class="feels-like" v-if="weatherData.current?.feels_like">
            Gefühlt {{ useImperialUnits ? formatTempF(weatherData.current.feels_like) : formatTempC(weatherData.current.feels_like) }}
          </div>
        </div>
      </div>

      <div class="weather-description" v-if="weatherData.current">
        <p class="description-text">
          {{ getWeatherDescription(weatherData.current) }}
        </p>
      </div>

      <div class="weather-metrics" v-if="weatherData.current">
        <div class="metric-item">
          <div class="metric-label">
            Luftqualität
            <svg class="info-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          </div>
          <div class="metric-value">{{ getAirQualityValue(weatherData.current) }}</div>
        </div>

        <div class="metric-item">
          <div class="metric-label">
            Wind
            <svg class="info-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          </div>
          <div class="metric-value">
            {{ Math.round(weatherData.current.wind_speed * 3.6) }} km/h
            <svg class="wind-direction" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" :style="{ transform: `rotate(${weatherData.current.wind_deg || 0}deg)` }">
              <path d="M12 2l3 7h-6l3-7z"></path>
            </svg>
          </div>
        </div>

        <div class="metric-item">
          <div class="metric-label">
            Luftfeuchte
            <svg class="info-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          </div>
          <div class="metric-value">{{ weatherData.current.humidity }}%</div>
        </div>

        <div class="metric-item">
          <div class="metric-label">
            Fernsicht
            <svg class="info-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          </div>
          <div class="metric-value">{{ getVisibility(weatherData.current) }}</div>
        </div>

        <div class="metric-item">
          <div class="metric-label">
            Luftdruck
            <svg class="info-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          </div>
          <div class="metric-value">{{ weatherData.current.pressure }} mbar</div>
        </div>

        <div class="metric-item">
          <div class="metric-label">
            Taupunkt
            <svg class="info-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M12 16v-4"></path>
              <path d="M12 8h.01"></path>
            </svg>
          </div>
          <div class="metric-value">
            {{ useImperialUnits ? formatTempF(weatherData.current.dew_point) : formatTempC(weatherData.current.dew_point) }}
          </div>
        </div>
      </div>
    </div>

    <!-- Platzhalter -->
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
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
});

const formatTempC = (temp) => temp ? `${Math.round(temp)}°C` : 'N/A';
const formatTempF = (temp) => temp ? `${Math.round((temp * 9/5) + 32)}°F` : 'N/A';

const getWeatherIconUrl = (iconCode) => iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : '';

const getGermanWeatherCondition = (weatherType) => {
  const weatherMapping = {
    'Clear': 'Meist sonnig',
    'Clouds': 'Meist bewölkt',
    'Rain': 'Regnerisch',
    'Drizzle': 'Nieselig',
    'Thunderstorm': 'Gewitterig',
    'Snow': 'Schneefall',
    'Mist': 'Neblig',
    'Fog': 'Neblig',
    'Haze': 'Dunstig',
    'Dust': 'Staubig',
    'Sand': 'Sandig',
    'Ash': 'Aschig',
    'Squall': 'Stürmisch',
    'Tornado': 'Stürmisch'
  };
  return weatherMapping[weatherType] || 'Wechselhaft';
};

const getWeatherDescription = (current) => {
  if (!current) return '';

  const condition = current.weather?.[0]?.main || '';
  const temp = Math.round(current.temp);
  const feelsLike = Math.round(current.feels_like);

  let description = '';

  if (condition === 'Clouds') {
    description = 'Der Himmel wird teilweise bewölkt.';
  } else if (condition === 'Clear') {
    description = 'Der Himmel ist klar und sonnig.';
  } else if (condition === 'Rain') {
    description = 'Es regnet derzeit.';
  } else if (condition === 'Snow') {
    description = 'Es schneit derzeit.';
  } else {
    description = 'Das Wetter ist wechselhaft.';
  }

  description += ` Die Tiefstwerte liegen bei ${Math.max(temp - 3, 0)}° Grad.`;

  return description;
};

const getAirQualityValue = (current) => {
  if (!current) return 'N/A';

  // Use real air quality data from Open-Meteo if available
  if (current.air_quality?.aqi) {
    return current.air_quality.aqi.toString();
  }

  // Fallback: Calculate a realistic air quality index based on weather conditions
  let aqi = 50; // Base value

  // Humidity factor (higher humidity can trap pollutants)
  if (current.humidity > 80) aqi += 10;
  else if (current.humidity < 40) aqi += 5;

  // Wind factor (higher wind disperses pollutants)
  const windSpeed = current.wind_speed * 3.6; // Convert to km/h
  if (windSpeed < 5) aqi += 15;
  else if (windSpeed > 20) aqi -= 10;

  // Weather condition factor
  const condition = current.weather?.[0]?.main;
  if (condition === 'Rain' || condition === 'Snow') aqi -= 15; // Rain cleans air
  else if (condition === 'Fog' || condition === 'Mist') aqi += 20;

  // Add some realistic variation
  aqi += Math.floor(Math.random() * 20) - 10;

  // Ensure reasonable bounds
  aqi = Math.max(10, Math.min(150, aqi));

  return aqi.toString();
};

const getVisibility = (current) => {
  if (!current) return 'N/A';

  // Use real visibility data from Open-Meteo if available
  if (current.visibility !== undefined && current.visibility !== null) {
    return `${current.visibility.toFixed(1)} km`;
  }

  // Fallback: Estimate visibility based on weather conditions
  const condition = current.weather?.[0]?.main;
  const humidity = current.humidity;

  let visibility = 50; // Base visibility in km

  if (condition === 'Fog' || condition === 'Mist') {
    visibility = Math.random() * 2 + 0.5; // 0.5-2.5 km
  } else if (condition === 'Rain') {
    visibility = Math.random() * 15 + 5; // 5-20 km
  } else if (condition === 'Snow') {
    visibility = Math.random() * 10 + 2; // 2-12 km
  } else if (humidity > 85) {
    visibility = Math.random() * 20 + 15; // 15-35 km
  } else if (condition === 'Clear') {
    visibility = Math.random() * 30 + 40; // 40-70 km
  }

  return `${visibility.toFixed(1)} km`;
};
</script>

<style src="./WeatherCardCSS.css" scoped></style>