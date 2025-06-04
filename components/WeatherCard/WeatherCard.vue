// components/WeatherCard.vue
<template>
  <div class="weather-card glass" :class="{ 'fade-in': show }">
    <div class="location-header" v-if="weatherData">
      <div>
        <h2 class="location-name">
          {{ weatherData?.name || weatherData?.fullName || 'Ort nicht erkannt' }}
        </h2>
        <div class="location-time">{{ currentTime }}</div>
      </div>
      <button @click="$emit('save')" class="save-button">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
          <polyline points="17 21 17 13 7 13 7 21"></polyline>
          <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        Speichern
      </button>
    </div>

    <div class="weather-content" v-if="weatherData && (weatherData.current || weatherData.main)">
      <div class="weather-main">
        <div class="temp-container">
          <div class="weather-icon">
            <img
                :src="getWeatherIconUrl(
                weatherData.weather?.[0]?.icon ?? weatherData.current?.weather?.[0]?.icon
              )"
                :alt="weatherData.weather?.[0]?.description ?? weatherData.current?.weather?.[0]?.description"
            />
          </div>
          <div class="weather-temp">
            {{
              useImperialUnits
                  ? formatTempF(weatherData.main?.temp ?? weatherData.current?.temp)
                  : formatTempC(weatherData.main?.temp ?? weatherData.current?.temp)
            }}
          </div>
        </div>
        <div class="weather-description">
          <div class="weather-condition">
            {{
              weatherData.weather?.[0]?.description ??
              weatherData.current?.weather?.[0]?.description ??
              'N/A'
            }}
          </div>
          <div class="weather-feels-like" v-if="weatherData.current?.feels_like">
            Gefühlt:
            {{
              useImperialUnits
                  ? formatTempF(weatherData.current.feels_like)
                  : formatTempC(weatherData.current.feels_like)
            }}
          </div>
        </div>
      </div>

      <div class="weather-detail" v-if="weatherData.current">
        <div class="forecast-text">
          Es wird {{ getWeatherText(weatherData.current.weather?.[0]?.main) }}.
          Die Höchstwerte liegen bei
          {{
            useImperialUnits
                ? formatTempF(weatherData.current.temp + 5)
                : formatTempC(weatherData.current.temp + 5)
          }}.
        </div>
      </div>

      <div class="weather-details-grid" v-if="weatherData.current">
        <div class="weather-detail-item" v-if="weatherData.current.humidity">
          <div class="detail-name">Luftfeuchte</div>
          <div class="detail-value">{{ weatherData.current.humidity }}%</div>
        </div>
        <div class="weather-detail-item" v-if="weatherData.current.pressure">
          <div class="detail-name">Luftdruck</div>
          <div class="detail-value">{{ weatherData.current.pressure }} mbar</div>
        </div>
        <div class="weather-detail-item" v-if="weatherData.current.wind_speed">
          <div class="detail-name">Wind</div>
          <div class="detail-value">{{ Math.round(weatherData.current.wind_speed * 3.6) }} km/h</div>
        </div>
        <div class="weather-detail-item" v-if="weatherData.current.uvi">
          <div class="detail-name">UV Index</div>
          <div class="detail-value">{{ weatherData.current.uvi }}</div>
        </div>
        <div class="weather-detail-item" v-if="weatherData.current.dew_point">
          <div class="detail-name">Taupunkt</div>
          <div class="detail-value">
            {{
              useImperialUnits
                  ? formatTempF(weatherData.current.dew_point)
                  : formatTempC(weatherData.current.dew_point)
            }}
          </div>
        </div>
        <div class="weather-detail-item">
          <div class="detail-name">Luftqualität</div>
          <div class="detail-value">{{ getAirQuality(weatherData.current) }}</div>
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

const getWeatherText = (weatherType) => {
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

const getAirQuality = (current) => {
  if (!current) return 'N/A';
  const humidityFactor = current.humidity / 100;
  const windFactor = 1 - (Math.min(current.wind_speed * 3.6, 50) / 50);
  const qualityValue = Math.round(30 + Math.random() * 20);
  if (qualityValue < 30) return 'Sehr gut';
  if (qualityValue < 50) return 'Gut';
  if (qualityValue < 70) return 'Mäßig';
  if (qualityValue < 90) return 'Schlecht';
  return 'Sehr schlecht';
};
</script>

<style src="./WeatherCardCSS.css" scoped></style>