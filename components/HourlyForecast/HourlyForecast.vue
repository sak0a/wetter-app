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
          <h3 class="details-title">{{ getActiveTabTitle() }}</h3>
          <div class="details-grid">
            <div
              v-for="container in getActiveTabContainers()"
              :key="container.key"
              class="detail-card"
            >
              <div class="detail-header">
                <span class="detail-icon">{{ container.icon }}</span>
                <span class="detail-title-text">{{ container.title }}</span>
              </div>
              <div class="detail-value-large">{{ container.value }}</div>
              <div class="detail-description">{{ container.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Niederschlag Tab -->
      <div v-if="activeTab === 'precipitation'" class="tab-panel">
        <div class="chart-container">
          <canvas ref="precipitationChart"></canvas>
        </div>

        <!-- Weather Details Section -->
        <div class="weather-details">
          <h3 class="details-title">{{ getActiveTabTitle() }}</h3>
          <div class="details-grid">
            <div
              v-for="container in getActiveTabContainers()"
              :key="container.key"
              class="detail-card"
            >
              <div class="detail-header">
                <span class="detail-icon">{{ container.icon }}</span>
                <span class="detail-title-text">{{ container.title }}</span>
              </div>
              <div class="detail-value-large">{{ container.value }}</div>
              <div class="detail-description">{{ container.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Wind Tab -->
      <div v-if="activeTab === 'wind'" class="tab-panel">
        <div class="chart-container">
          <canvas ref="windChart"></canvas>
        </div>

        <!-- Weather Details Section -->
        <div class="weather-details">
          <h3 class="details-title">{{ getActiveTabTitle() }}</h3>
          <div class="details-grid">
            <div
              v-for="container in getActiveTabContainers()"
              :key="container.key"
              class="detail-card"
            >
              <div class="detail-header">
                <span class="detail-icon">{{ container.icon }}</span>
                <span class="detail-title-text">{{ container.title }}</span>
              </div>
              <div class="detail-value-large">{{ container.value }}</div>
              <div class="detail-description">{{ container.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Luftqualität Tab -->
      <div v-if="activeTab === 'airquality'" class="tab-panel">
        <div class="chart-container">
          <canvas ref="airQualityChart"></canvas>
        </div>

        <!-- Weather Details Section -->
        <div class="weather-details">
          <h3 class="details-title">{{ getActiveTabTitle() }}</h3>
          <div class="details-grid">
            <div
              v-for="container in getActiveTabContainers()"
              :key="container.key"
              class="detail-card"
            >
              <div class="detail-header">
                <span class="detail-icon">{{ container.icon }}</span>
                <span class="detail-title-text">{{ container.title }}</span>
              </div>
              <div class="detail-value-large">{{ container.value }}</div>
              <div class="detail-description">{{ container.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bewölkt Tab -->
      <div v-if="activeTab === 'cloudcover'" class="tab-panel">
        <div class="chart-container">
          <canvas ref="cloudCoverChart"></canvas>
        </div>

        <!-- Weather Details Section -->
        <div class="weather-details">
          <h3 class="details-title">{{ getActiveTabTitle() }}</h3>
          <div class="details-grid">
            <div
              v-for="container in getActiveTabContainers()"
              :key="container.key"
              class="detail-card"
            >
              <div class="detail-header">
                <span class="detail-icon">{{ container.icon }}</span>
                <span class="detail-title-text">{{ container.title }}</span>
              </div>
              <div class="detail-value-large">{{ container.value }}</div>
              <div class="detail-description">{{ container.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sichtbarkeit Tab -->
      <div v-if="activeTab === 'visibility'" class="tab-panel">
        <div class="chart-container">
          <canvas ref="visibilityChart"></canvas>
        </div>

        <!-- Weather Details Section -->
        <div class="weather-details">
          <h3 class="details-title">{{ getActiveTabTitle() }}</h3>
          <div class="details-grid">
            <div
              v-for="container in getActiveTabContainers()"
              :key="container.key"
              class="detail-card"
            >
              <div class="detail-header">
                <span class="detail-icon">{{ container.icon }}</span>
                <span class="detail-title-text">{{ container.title }}</span>
              </div>
              <div class="detail-value-large">{{ container.value }}</div>
              <div class="detail-description">{{ container.description }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Sonnenstrahlung Tab -->
      <div v-if="activeTab === 'solar'" class="tab-panel">
        <div class="chart-container">
          <canvas ref="solarRadiationChart"></canvas>
        </div>

        <!-- Weather Details Section -->
        <div class="weather-details">
          <h3 class="details-title">{{ getActiveTabTitle() }}</h3>
          <div class="details-grid">
            <div
              v-for="container in getActiveTabContainers()"
              :key="container.key"
              class="detail-card"
            >
              <div class="detail-header">
                <span class="detail-icon">{{ container.icon }}</span>
                <span class="detail-title-text">{{ container.title }}</span>
              </div>
              <div class="detail-value-large">{{ container.value }}</div>
              <div class="detail-description">{{ container.description }}</div>
            </div>
          </div>
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

<script src="./HourlyForecast.script.js"></script>
<style src="./HourlyForecast.css" scoped></style>
