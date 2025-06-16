
<template>
  <div class="history-section" v-if="history.length > 0">
    <h2 class="history-title">Gespeicherte Orte</h2>
    <div class="history-grid">
      <div
          v-for="item in history"
          :key="item.id"
          class="history-card glass"
          @click="$emit('select', item)"
      >
        <!-- Card Header -->
        <div
            class="history-card-header"
            :class="item.current && item.current.weather ?
            getWeatherConditionClass(item.current.weather[0]?.id) : ''"
        >
          <div class="history-location">
            <h3 class="history-location-name">{{ item.name }}</h3>
            <p class="history-date">{{ formatDate() }}</p>
          </div>
          <div class="history-actions">
            <button
                class="history-action-btn view-btn"
                @click.stop="$emit('select', item)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button
                class="history-action-btn remove-btn"
                @click.stop="$emit('remove', item.id, $event)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"></path>
                <path d="m6 6 12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Card Content -->
        <div class="history-card-content">
          <div class="history-weather-main">
            <img
                v-if="item.current?.weather && item.current.weather[0]"
                :src="getWeatherIconUrl(item.current.weather[0].icon)"
                :alt="item.current.weather[0].description"
                class="history-weather-icon"
            />
            <div class="history-temp">{{ formatTemp(item.current?.temp) }}</div>
          </div>
          <div class="history-weather-desc">
            {{ item.current?.weather && item.current.weather[0] ? item.current.weather[0].description : 'N/A' }}
          </div>

          <!-- Weather Details -->
          <div class="history-weather-details">
            <div class="history-detail-item">
              <div class="history-detail-label">Gefühlt</div>
              <div class="history-detail-value">{{ formatTemp(item.current?.feels_like) }}</div>
            </div>
            <div class="history-detail-item">
              <div class="history-detail-label">Luftfeuchte</div>
              <div class="history-detail-value">{{ item.current ? `${item.current.humidity}%` : 'N/A' }}</div>
            </div>
            <div class="history-detail-item">
              <div class="history-detail-label">Wind</div>
              <div class="history-detail-value">{{ item.current ? `${Math.round(item.current.wind_speed * 3.6)} km/h` : 'N/A' }}</div>
            </div>
            <div class="history-detail-item">
              <div class="history-detail-label">UV Index</div>
              <div class="history-detail-value">{{ item.current ? item.current.uvi : 'N/A' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  history: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['select', 'remove']);

// Format temperature
const formatTemp = (temp) => {
  return temp ? `${Math.round(temp)}°C` : 'N/A';
};

// Get weather icon URL
const getWeatherIconUrl = (iconCode) => {
  return iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : '';
};

// Format date
const formatDate = () => {
  const now = new Date();
  return now.toLocaleDateString();
};

// Get weather condition class
const getWeatherConditionClass = (weatherCode) => {
  if (!weatherCode) return 'weather-default';

  const code = weatherCode.toString();
  if (code.startsWith('2')) return 'weather-thunderstorm';
  if (code.startsWith('3')) return 'weather-drizzle';
  if (code.startsWith('5')) return 'weather-rain';
  if (code.startsWith('6')) return 'weather-snow';
  if (code.startsWith('7')) return 'weather-atmosphere';
  if (code === '800') return 'weather-clear';
  if (code.startsWith('8')) return 'weather-clouds';

  return 'weather-default';
};
</script>

<style src="./WeatherHistory.css" scoped></style>