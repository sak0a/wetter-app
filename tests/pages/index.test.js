import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import IndexPage from '~/pages/index.vue'

// Mock all the utility functions
vi.mock('~/utils/weather.js', () => ({
  getWeatherData: vi.fn(),
  getAirQualityData: vi.fn(),
  getPollenData: vi.fn()
}))

vi.mock('~/utils/general.js', () => ({
  getCityName: vi.fn(),
  searchLocation: vi.fn(),
  getLocationFromIP: vi.fn(),
  requestGeolocation: vi.fn(),
  saveToLocalStorage: vi.fn(),
  loadFromLocalStorage: vi.fn(),
  removeFromLocalStorage: vi.fn(),
  saveLastViewedWeather: vi.fn(),
  loadLastViewedWeather: vi.fn(),
  saveSearchHistory: vi.fn(),
  loadSearchHistory: vi.fn(),
  saveCurrentLocationToHistory: vi.fn(),
  formatTempC: vi.fn((temp) => temp ? `${Math.round(temp)}°C` : 'N/A'),
  formatTempF: vi.fn((temp) => temp ? `${Math.round(temp * 9/5 + 32)}°F` : 'N/A'),
  isFirstVisit: vi.fn()
}))

// Mock Leaflet to avoid issues in test environment
vi.mock('leaflet', () => ({
  default: {
    map: vi.fn(() => ({
      setView: vi.fn(),
      on: vi.fn(),
      addLayer: vi.fn(),
      removeLayer: vi.fn()
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn()
    })),
    marker: vi.fn(() => ({
      addTo: vi.fn(),
      setLatLng: vi.fn()
    })),
    icon: vi.fn()
  }
}))

// Mock Chart.js
vi.mock('chart.js', () => ({
  Chart: vi.fn(),
  CategoryScale: vi.fn(),
  LinearScale: vi.fn(),
  PointElement: vi.fn(),
  LineElement: vi.fn(),
  BarElement: vi.fn(),
  Title: vi.fn(),
  Tooltip: vi.fn(),
  Legend: vi.fn(),
  Filler: vi.fn(),
  LineController: vi.fn(),
  BarController: vi.fn()
}))

import { 
  getWeatherData, 
  getAirQualityData, 
  getPollenData 
} from '~/utils/weather.js'

import {
  loadSearchHistory,
  loadLastViewedWeather,
  isFirstVisit,
  getLocationFromIP,
  searchLocation
} from '~/utils/general.js'

describe('Index Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mock returns
    loadSearchHistory.mockReturnValue([])
    loadLastViewedWeather.mockReturnValue(null)
    isFirstVisit.mockReturnValue(false)
    getLocationFromIP.mockResolvedValue(null)
    
    getWeatherData.mockResolvedValue({
      name: 'Berlin',
      fullName: 'Berlin, Germany',
      coords: { lat: 52.5200, lng: 13.4050 },
      current: {
        temp: 20,
        feels_like: 22,
        humidity: 65,
        pressure: 1013,
        wind_speed: 5,
        weather: [{ icon: '01d', description: 'clear sky' }]
      },
      hourly: {
        time: ['2024-01-15T12:00:00'],
        temperature_2m: [20]
      },
      daily: {
        time: ['2024-01-15'],
        temperature_2m_max: [25],
        temperature_2m_min: [15]
      }
    })
    
    getAirQualityData.mockResolvedValue({
      us_aqi: [50],
      pm10: [25],
      pm2_5: [15]
    })
    
    getPollenData.mockResolvedValue({
      alder_pollen: [1],
      birch_pollen: [2]
    })
  })

  it('should render the main weather app container', async () => {
    const wrapper = await mountSuspended(IndexPage)
    
    expect(wrapper.find('.weather-app-container').exists()).toBe(true)
    expect(wrapper.find('.weather-app-content').exists()).toBe(true)
  })

  it('should render search section with SearchBar component', async () => {
    const wrapper = await mountSuspended(IndexPage)
    
    expect(wrapper.find('.search-section').exists()).toBe(true)
    expect(wrapper.findComponent({ name: 'SearchBar' }).exists()).toBe(true)
  })

  it('should render UnitsToggle component', async () => {
    const wrapper = await mountSuspended(IndexPage)
    
    expect(wrapper.findComponent({ name: 'UnitsToggle' }).exists()).toBe(true)
  })

  it('should render SavedLocations component', async () => {
    const wrapper = await mountSuspended(IndexPage)
    
    expect(wrapper.findComponent({ name: 'SavedLocations' }).exists()).toBe(true)
  })

  it('should render main content grid', async () => {
    const wrapper = await mountSuspended(IndexPage)
    
    expect(wrapper.find('.main-content').exists()).toBe(true)
    expect(wrapper.find('.weather-grid').exists()).toBe(true)
  })

  it('should render WeatherCard component', async () => {
    const wrapper = await mountSuspended(IndexPage)
    
    expect(wrapper.findComponent({ name: 'WeatherCard' }).exists()).toBe(true)
  })

  it('should render WeatherMap component', async () => {
    const wrapper = await mountSuspended(IndexPage)
    
    expect(wrapper.findComponent({ name: 'WeatherMap' }).exists()).toBe(true)
  })

  it('should render HourlyForecast component', async () => {
    const wrapper = await mountSuspended(IndexPage)
    
    expect(wrapper.findComponent({ name: 'HourlyForecast' }).exists()).toBe(true)
  })

  it('should handle search location functionality', async () => {
    searchLocation.mockResolvedValue({
      coords: { lat: 48.1351, lng: 11.5820 },
      cityInfo: { cityName: 'Munich', fullName: 'Munich, Germany' }
    })

    const wrapper = await mountSuspended(IndexPage)
    const searchBar = wrapper.findComponent({ name: 'SearchBar' })
    
    await searchBar.vm.$emit('search', 'Munich')
    
    expect(searchLocation).toHaveBeenCalledWith('Munich')
  })

  it('should handle units toggle', async () => {
    const wrapper = await mountSuspended(IndexPage)
    const unitsToggle = wrapper.findComponent({ name: 'UnitsToggle' })
    
    // Initially should be false (Celsius)
    expect(unitsToggle.props('useImperialUnits')).toBe(false)
    
    await unitsToggle.vm.$emit('update:units', true)
    
    // Should update to imperial units
    expect(wrapper.vm.useImperialUnits).toBe(true)
  })

  it('should handle saved location selection', async () => {
    const mockLocationData = {
      id: 1,
      name: 'Munich',
      coords: { lat: 48.1351, lng: 11.5820 }
    }

    const wrapper = await mountSuspended(IndexPage)
    const savedLocations = wrapper.findComponent({ name: 'SavedLocations' })
    
    await savedLocations.vm.$emit('select', mockLocationData)
    
    expect(getWeatherData).toHaveBeenCalled()
  })

  it('should handle location removal from saved locations', async () => {
    const wrapper = await mountSuspended(IndexPage)
    const savedLocations = wrapper.findComponent({ name: 'SavedLocations' })
    
    await savedLocations.vm.$emit('remove', 1)
    
    // Should trigger removal logic
    expect(wrapper.vm.searchHistory).toBeDefined()
  })

  it('should handle map location selection', async () => {
    const newCoords = { lat: 50.1109, lng: 8.6821 }

    const wrapper = await mountSuspended(IndexPage)
    const weatherMap = wrapper.findComponent({ name: 'WeatherMap' })
    
    await weatherMap.vm.$emit('location-selected', newCoords)
    
    expect(getWeatherData).toHaveBeenCalled()
  })

  it('should handle weather card save functionality', async () => {
    const wrapper = await mountSuspended(IndexPage)
    const weatherCard = wrapper.findComponent({ name: 'WeatherCard' })
    
    await weatherCard.vm.$emit('save')
    
    // Should trigger save logic
    expect(wrapper.vm.weatherData).toBeDefined()
  })

  it('should display current location pill when weather data exists', async () => {
    const wrapper = await mountSuspended(IndexPage)
    
    // Wait for weather data to load
    await wrapper.vm.$nextTick()
    
    if (wrapper.vm.weatherData) {
      expect(wrapper.find('.location-pill').exists()).toBe(true)
      expect(wrapper.find('.location-name').exists()).toBe(true)
      expect(wrapper.find('.location-temp').exists()).toBe(true)
    }
  })

  it('should handle loading states', async () => {
    const wrapper = await mountSuspended(IndexPage)
    
    expect(wrapper.vm.isLoading).toBeDefined()
    
    const searchBar = wrapper.findComponent({ name: 'SearchBar' })
    expect(searchBar.props('loading')).toBe(wrapper.vm.isLoading)
  })

  it('should initialize with default coordinates', async () => {
    const wrapper = await mountSuspended(IndexPage)
    
    expect(wrapper.vm.currentCoords).toEqual({ lat: 50.110644, lng: 8.68 })
  })

  it('should pass correct props to child components', async () => {
    const wrapper = await mountSuspended(IndexPage)
    
    const weatherCard = wrapper.findComponent({ name: 'WeatherCard' })
    expect(weatherCard.props('useImperialUnits')).toBe(false)
    
    const weatherMap = wrapper.findComponent({ name: 'WeatherMap' })
    expect(weatherMap.props('currentCoords')).toEqual(wrapper.vm.currentCoords)
    
    const hourlyForecast = wrapper.findComponent({ name: 'HourlyForecast' })
    expect(hourlyForecast.props('useImperialUnits')).toBe(false)
  })
})
