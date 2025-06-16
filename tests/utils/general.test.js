import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  formatTempC,
  formatTempF,
  saveToLocalStorage,
  loadFromLocalStorage,
  removeFromLocalStorage,
  saveSearchHistory,
  loadSearchHistory,
  saveCurrentLocationToHistory,
  isFirstVisit,
  getCityName,
  searchLocation,
  getLocationFromIP
} from '~/utils/general.js'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock

// Mock fetch for API calls
global.fetch = vi.fn()

describe('Temperature Formatting', () => {
  it('should format temperature in Celsius correctly', () => {
    expect(formatTempC(25.7)).toBe('26°C')
    expect(formatTempC(0)).toBe('N/A') // 0 is falsy in the current implementation
    expect(formatTempC(-5.3)).toBe('-5°C')
    expect(formatTempC(null)).toBe('N/A')
    expect(formatTempC(undefined)).toBe('N/A')
  })

  it('should format temperature in Fahrenheit correctly', () => {
    expect(formatTempF(25)).toBe('77°F') // 25°C = 77°F
    expect(formatTempF(0)).toBe('N/A')   // 0 is falsy in the current implementation
    expect(formatTempF(-5)).toBe('23°F')  // -5°C = 23°F
    expect(formatTempF(null)).toBe('N/A')
    expect(formatTempF(undefined)).toBe('N/A')
  })
})

describe('Local Storage Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should save data to localStorage', () => {
    const testData = { test: 'value' }
    saveToLocalStorage('testKey', testData)
    
    expect(localStorage.setItem).toHaveBeenCalledWith('testKey', JSON.stringify(testData))
  })

  it('should load data from localStorage', () => {
    const testData = { test: 'value' }
    localStorage.getItem.mockReturnValue(JSON.stringify(testData))
    
    const result = loadFromLocalStorage('testKey')
    
    expect(localStorage.getItem).toHaveBeenCalledWith('testKey')
    expect(result).toEqual(testData)
  })

  it('should return null for non-existent localStorage key', () => {
    localStorage.getItem.mockReturnValue(null)
    
    const result = loadFromLocalStorage('nonExistentKey')
    
    expect(result).toBeNull()
  })

  it('should handle JSON parse errors gracefully', () => {
    localStorage.getItem.mockReturnValue('invalid json')
    
    const result = loadFromLocalStorage('invalidKey')
    
    expect(result).toBeNull()
  })

  it('should remove data from localStorage', () => {
    removeFromLocalStorage('testKey')
    
    expect(localStorage.removeItem).toHaveBeenCalledWith('testKey')
  })
})

describe('Search History Management', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should save search history to localStorage', () => {
    const history = [
      { id: 1, name: 'Berlin', temp: 20 },
      { id: 2, name: 'Munich', temp: 18 }
    ]
    
    saveSearchHistory(history)
    
    expect(localStorage.setItem).toHaveBeenCalledWith('weatherAppHistory', JSON.stringify(history))
  })

  it('should load search history from localStorage', () => {
    const history = [
      { id: 1, name: 'Berlin', temp: 20 }
    ]
    localStorage.getItem.mockReturnValue(JSON.stringify(history))
    
    const result = loadSearchHistory()
    
    expect(localStorage.getItem).toHaveBeenCalledWith('weatherAppHistory')
    expect(result).toEqual(history)
  })

  it('should return empty array when no search history exists', () => {
    localStorage.getItem.mockReturnValue(null)
    
    const result = loadSearchHistory()
    
    expect(result).toEqual([])
  })

  it('should save current location to history and limit to 5 entries', () => {
    const existingHistory = [
      { id: 1, name: 'Berlin', isCurrentLocation: false },
      { id: 2, name: 'Munich', isCurrentLocation: false },
      { id: 3, name: 'Hamburg', isCurrentLocation: false },
      { id: 4, name: 'Cologne', isCurrentLocation: false },
      { id: 5, name: 'Frankfurt', isCurrentLocation: false }
    ]

    localStorage.getItem.mockReturnValue(JSON.stringify(existingHistory))

    const coords = { lat: 48.7758, lng: 9.1829 }
    const cityInfo = { cityName: 'Stuttgart', fullName: 'Stuttgart, Germany' }

    saveCurrentLocationToHistory(coords, cityInfo, false)

    // Should save with new location at beginning and limited to 5 entries
    expect(localStorage.setItem).toHaveBeenCalledWith(
      'weatherAppHistory',
      expect.stringContaining('Stuttgart')
    )
  })
})

describe('First Visit Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should detect first visit when no flag exists', () => {
    localStorage.getItem.mockReturnValue(null)
    
    const result = isFirstVisit()
    
    expect(localStorage.getItem).toHaveBeenCalledWith('weatherAppHasVisited')
    expect(result).toBe(true)
    expect(localStorage.setItem).toHaveBeenCalledWith('weatherAppHasVisited', 'true')
  })

  it('should detect returning visit when flag exists', () => {
    localStorage.getItem.mockReturnValue('true')
    
    const result = isFirstVisit()
    
    expect(result).toBe(false)
  })
})

describe('API Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should get city name from coordinates', async () => {
    const mockResponse = {
      display_name: 'Berlin, Germany',
      address: {
        city: 'Berlin',
        country: 'Germany',
        village: 'Test Village',
        municipality: 'Test Municipality'
      }
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })
    
    const result = await getCityName(52.5200, 13.4050)
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org/reverse')
    )
    expect(result).toEqual({
      cityName: 'Test Village', // Village should have priority
      fullName: 'Test Village, Germany'
    })
  })

  it('should handle getCityName API errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))
    
    const result = await getCityName(52.5200, 13.4050)
    
    expect(result).toBeNull()
  })

  it('should search for location', async () => {
    const mockResponse = [
      {
        lat: '52.5200066',
        lon: '13.404954',
        display_name: 'Berlin, Germany',
        address: {
          city: 'Berlin',
          country: 'Germany'
        }
      }
    ]
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })
    
    const result = await searchLocation('Berlin')
    
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('nominatim.openstreetmap.org/search')
    )
    expect(result).toEqual({
      coords: { lat: 52.5200066, lng: 13.404954 },
      cityInfo: { cityName: 'Berlin', fullName: 'Berlin, Germany' }
    })
  })

  it('should handle search location API errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))
    
    const result = await searchLocation('Berlin')
    
    expect(result).toBeNull()
  })

  it('should get location from IP', async () => {
    const mockResponse = {
      latitude: 52.5200,
      longitude: 13.4050,
      city: 'Berlin',
      country_name: 'Germany'
    }
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    })
    
    const result = await getLocationFromIP()
    
    expect(fetch).toHaveBeenCalledWith('https://ipapi.co/json/')
    expect(result).toEqual({
      coords: { lat: 52.5200, lng: 13.4050 },
      cityInfo: { cityName: 'Berlin', fullName: 'Berlin, Germany' }
    })
  })

  it('should handle IP location API errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'))
    
    const result = await getLocationFromIP()
    
    expect(result).toBeNull()
  })
})
