<template>
  <div class="hourly-forecast glass" v-if="weatherData && weatherData.hourly">
    <!-- Loading State -->
    <div v-if="!weatherData.hourly.time || weatherData.hourly.time.length === 0" class="forecast-loading">
      <div class="loading-spinner"></div>
      <p>Lade stündliche Vorhersage...</p>
    </div>

    <!-- Main Content -->
    <div v-else>
    <!-- Header -->
    <div class="forecast-header">
      <h2 class="forecast-title">Stündliche Vorhersage</h2>
      <div class="forecast-period">
        <span class="period-text">Gestern bis 7 Tage</span>
      </div>
    </div>

    <!-- Daily Overview Cards -->
    <div class="daily-overview">
      <div class="daily-scroll-container">
        <div
          v-for="(day, index) in dailyCards"
          :key="index"
          class="daily-card"
          :class="{
            'today': day.isToday,
            'yesterday': day.isYesterday,
            'selected': day.isSelected
          }"
          @click="selectDay(day.index)"
        >
          <div class="daily-card-content">
            <div class="daily-left">
              <div class="daily-date">
                <span class="day-name">{{ day.dayName }}</span>
                <span class="day-number">{{ day.dayNumber }}</span>
              </div>
            </div>
            <div class="daily-center">
              <div class="daily-weather">
                <img
                  :src="getWeatherIconUrl(day.icon)"
                  :alt="day.condition"
                  class="daily-icon"
                />
              </div>
            </div>
            <div class="daily-right">
              <div class="daily-temps">
                <span class="temp-max">{{ formatTemp(day.tempMax) }}</span>
                <span class="temp-min">{{ formatTemp(day.tempMin) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tab Navigation -->
    <div class="tab-navigation">
      <button 
        v-for="tab in tabs" 
        :key="tab.id"
        class="tab-button"
        :class="{ 'active': activeTab === tab.id }"
        @click="setActiveTab(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- Tab Content -->
    <div class="tab-content">
      <!-- Übersicht Tab -->
      <div v-if="activeTab === 'overview'" class="tab-panel">
        <div class="chart-container">
          <canvas ref="overviewChart"></canvas>
        </div>
        
        <!-- Weather Details Section -->
        <div class="weather-details">
          <h3 class="details-title">Wetterdetails</h3>
          <div class="details-grid">
            <div class="detail-card">
              <div class="detail-header">
                <span class="detail-icon">🌡️</span>
                <span class="detail-title-text">Gefühlte Temperatur</span>
              </div>
              <div class="detail-value-large">{{ getCurrentFeelsLike() }}</div>
              <div class="detail-description">Wie sich die Temperatur anfühlt</div>
            </div>

            <div class="detail-card">
              <div class="detail-header">
                <span class="detail-icon">💧</span>
                <span class="detail-title-text">Luftfeuchtigkeit</span>
              </div>
              <div class="detail-value-large">{{ getCurrentHumidity() }}</div>
              <div class="detail-description">Relative Luftfeuchtigkeit</div>
            </div>

            <div class="detail-card">
              <div class="detail-header">
                <span class="detail-icon">🌫️</span>
                <span class="detail-title-text">Taupunkt</span>
              </div>
              <div class="detail-value-large">{{ getCurrentDewPoint() }}</div>
              <div class="detail-description">Kondensationstemperatur</div>
            </div>

            <div class="detail-card">
              <div class="detail-header">
                <span class="detail-icon">📊</span>
                <span class="detail-title-text">Luftdruck</span>
              </div>
              <div class="detail-value-large">{{ getCurrentPressure() }}</div>
              <div class="detail-description">Atmosphärischer Druck</div>
            </div>

            <div class="detail-card">
              <div class="detail-header">
                <span class="detail-icon">👁️</span>
                <span class="detail-title-text">Sichtweite</span>
              </div>
              <div class="detail-value-large">{{ getCurrentVisibility() }}</div>
              <div class="detail-description">Horizontale Sichtweite</div>
            </div>

            <div class="detail-card">
              <div class="detail-header">
                <span class="detail-icon">☀️</span>
                <span class="detail-title-text">UV-Index</span>
              </div>
              <div class="detail-value-large">{{ getCurrentUVIndex() }}</div>
              <div class="detail-description">UV-Strahlungsintensität</div>
            </div>

            <div class="detail-card">
              <div class="detail-header">
                <span class="detail-icon">💨</span>
                <span class="detail-title-text">Wind</span>
              </div>
              <div class="detail-value-large">{{ getCurrentWindSpeed() }}</div>
              <div class="detail-description">{{ getCurrentWindDirection() }} Richtung</div>
            </div>

            <div class="detail-card">
              <div class="detail-header">
                <span class="detail-icon">☁️</span>
                <span class="detail-title-text">Bewölkung</span>
              </div>
              <div class="detail-value-large">{{ getCurrentCloudCover() }}</div>
              <div class="detail-description">Wolkenbedeckung</div>
            </div>

            <div class="detail-card">
              <div class="detail-header">
                <span class="detail-icon">🏭</span>
                <span class="detail-title-text">Luftqualität</span>
              </div>
              <div class="detail-value-large">{{ getCurrentAirQuality() }}</div>
              <div class="detail-description">US AQI Index</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Niederschlag Tab -->
      <div v-if="activeTab === 'precipitation'" class="tab-panel">
        <div class="chart-container">
          <canvas ref="precipitationChart"></canvas>
        </div>
      </div>

      <!-- Wind Tab -->
      <div v-if="activeTab === 'wind'" class="tab-panel">
        <div class="chart-container">
          <canvas ref="windChart"></canvas>
        </div>
      </div>

      <!-- Luftqualität Tab -->
      <div v-if="activeTab === 'airquality'" class="tab-panel">
        <div class="chart-container">
          <canvas ref="airQualityChart"></canvas>
        </div>
      </div>
    </div>
    </div> <!-- End of main content div -->
  </div>

  <!-- Placeholder when no weather data -->
  <div v-else class="hourly-forecast-placeholder glass">
    <div class="placeholder-content">
      <svg xmlns="http://www.w3.org/2000/svg" class="placeholder-icon" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 18h18"/>
        <path d="M3 12h18"/>
        <path d="M3 6h18"/>
      </svg>
      <h3>Stündliche Vorhersage</h3>
      <p>Suchen Sie nach einem Ort, um die stündliche Wettervorhersage anzuzeigen</p>
    </div>
  </div>
</template>

<script src="./HourlyForecastScript.js"></script>
<style src="./HourlyForecastCSS.css" scoped></style>
