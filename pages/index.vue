// pages/index.vue
<template>
  <div class="weather-app-container">
    <div class="weather-app-content">

      <div class="search-section">
        <div class="search-row">
          <div class="current-location-button" v-if="weatherData">
            <button class="location-pill" @click="requestLocationPermission">
              <div class="location-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                  <circle cx="12" cy="10" r="3"></circle>
                </svg>
              </div>
              <div class="location-info">
                <span class="location-name">{{ weatherData.name }}</span>
                <span class="location-temp">{{ useImperialUnits ? formatTempF(weatherData.current?.temp) : formatTempC(weatherData.current?.temp) }}</span>
              </div>
            </button>
          </div>

          <SearchBar
              :loading="isLoading"
              @search="searchLocation"
          />

          <UnitsToggle
              :useImperialUnits="useImperialUnits"
              @update:units="toggleUnits"
          />
        </div>
      </div>

      <SavedLocations
          :history="searchHistory"
          :useImperialUnits="useImperialUnits"
          :currentLocationId="currentLocationId"
          @select="loadHistoryItem"
          @remove="removeHistoryItem"
          @refresh-location="requestLocationPermission"
      />

      <div class="main-content">
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
                :weatherData="weatherData"
                :useImperialUnits="useImperialUnits"
                @location-selected="handleMapLocationSelected"
            />
          </div>
        </div>

        <!-- Hourly Forecast Component -->
        <div class="hourly-forecast-container">
          <HourlyForecast
              :weatherData="weatherData"
              :useImperialUnits="useImperialUnits"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script src="./index.script.js"></script>
<style src="./index.css" scoped></style>
