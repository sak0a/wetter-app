// pages/index.vue
<template>
  <div class="weather-app-container">
    <div class="weather-app-content">

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

      <SavedLocations
          :history="searchHistory"
          :useImperialUnits="useImperialUnits"
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
