
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

<style scoped>
.history-section {
  margin-top: 3rem;
}

.history-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1.5rem;
  color: white;
  position: relative;
  display: inline-block;
}

.history-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0));
  border-radius: 3px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.history-card {
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  z-index: 1;
}

.history-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
}

.history-card-header {
  padding: 1.25rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  color: white;
  background: linear-gradient(135deg, rgba(79, 109, 245, 0.8), rgba(79, 109, 245, 0.5));
  position: relative;
  overflow: hidden;
}

.history-card-header::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0));
  z-index: -1;
}

.history-location-name {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.25rem 0;
}

.history-date {
  font-size: 0.75rem;
  opacity: 0.8;
}

.history-actions {
  display: flex;
  gap: 0.5rem;
}

.history-action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.history-action-btn:hover {
  background: rgba(255, 255, 255, 0.3);
}

.history-action-btn.remove-btn:hover {
  background: rgba(255, 81, 81, 0.7);
}

.history-card-content {
  padding: 1.25rem;
}

.history-weather-main {
  display: flex;
  align-items: center;
  margin-bottom: 0.75rem;
}

.history-weather-icon {
  width: 48px;
  height: 48px;
  object-fit: contain;
}

.history-temp {
  font-size: 2.5rem;
  font-weight: 700;
  line-height: 1;
}

.history-weather-desc {
  font-size: 0.9rem;
  text-transform: capitalize;
  margin-bottom: 1.25rem;
  color: rgba(255, 255, 255, 0.8);
}

.history-weather-details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.history-detail-item {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 0.75rem;
}

.history-detail-label {
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.25rem;
}

.history-detail-value {
  font-size: 0.9rem;
  font-weight: 600;
}

/* Weather gradient classes */
.weather-default {
  background: linear-gradient(135deg, #5438dc, #4568dc);
}

.weather-clear {
  background: linear-gradient(135deg, #f7b733, #fc4a1a);
}

.weather-clouds {
  background: linear-gradient(135deg, #8e9eab, #616161);
}

.weather-rain {
  background: linear-gradient(135deg, #3a7bd5, #00d2ff);
}

.weather-thunderstorm {
  background: linear-gradient(135deg, #4b6cb7, #182848);
}

.weather-snow {
  background: linear-gradient(135deg, #e6dada, #274046);
}

.weather-drizzle {
  background: linear-gradient(135deg, #89f7fe, #66a6ff);
}

.weather-atmosphere {
  background: linear-gradient(135deg, #bdc3c7, #2c3e50);
}
</style>