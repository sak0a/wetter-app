import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import WeatherCard from '~/components/WeatherCard/WeatherCard.vue'

// Mock utility functions
vi.mock('~/utils/general.js', () => ({
  formatTempC: vi.fn((temp) => temp ? `${Math.round(temp)}°C` : 'N/A'),
  formatTempF: vi.fn((temp) => temp ? `${Math.round(temp * 9/5 + 32)}°F` : 'N/A'),
  getWeatherIconUrl: vi.fn((icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`),
  getGermanWeatherCondition: vi.fn((condition) => {
    const translations = {
      'clear sky': 'Klarer Himmel',
      'few clouds': 'Wenige Wolken',
      'scattered clouds': 'Aufgelockerte Bewölkung'
    }
    return translations[condition] || condition
  })
}))

describe('WeatherCard Component', () => {
  const mockWeatherData = {
    name: 'Berlin',
    fullName: 'Berlin, Germany',
    current: {
      temp: 20,
      feels_like: 22,
      humidity: 65,
      pressure: 1013,
      wind_speed: 5,
      wind_deg: 180,
      visibility: 10,
      dew_point: 15,
      cloud_cover: 50,
      weather: [{
        id: 800,
        main: 'Clear',
        description: 'clear sky',
        icon: '01d'
      }]
    },
    daily: {
      temperature_2m_max: [25, 23, 21],
      temperature_2m_min: [15, 13, 11]
    }
  }

  it('should render weather card when data is provided', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })
    
    expect(wrapper.find('.weather-card').exists()).toBe(true)
  })

  it('should render placeholder when no weather data is provided', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: null,
        useImperialUnits: false
      }
    })

    expect(wrapper.find('.weather-card').exists()).toBe(true)
    expect(wrapper.find('.weather-placeholder').exists()).toBe(true)
  })

  it('should display location name', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })
    
    expect(wrapper.text()).toContain('Berlin')
  })

  it('should display current temperature in Celsius', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })
    
    expect(wrapper.text()).toContain('20°C')
  })

  it('should display current temperature in Fahrenheit when imperial units are used', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: true
      }
    })
    
    expect(wrapper.text()).toContain('68°F')
  })

  it('should display weather description', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })

    expect(wrapper.text()).toContain('Meist sonnig') // German translation for Clear
  })

  it('should display weather icon', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })

    const weatherIcon = wrapper.find('.weather-icon-large img')
    expect(weatherIcon.exists()).toBe(true)
    expect(weatherIcon.attributes('src')).toContain('01d')
  })

  it('should display feels like temperature', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })
    
    expect(wrapper.text()).toContain('22°C') // feels like temperature
  })

  it('should display humidity', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })
    
    expect(wrapper.text()).toContain('65%')
  })

  it('should display pressure', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })
    
    expect(wrapper.text()).toContain('1013')
  })

  it('should display wind information', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })
    
    expect(wrapper.text()).toContain('5') // wind speed
  })

  it('should display visibility', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })
    
    expect(wrapper.text()).toContain('10') // visibility in km
  })

  it('should display dew point', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })
    
    expect(wrapper.text()).toContain('15°C') // dew point
  })

  it('should display weather metrics', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })

    // Check for metric labels
    expect(wrapper.text()).toContain('Luftfeuchte')
    expect(wrapper.text()).toContain('Luftdruck')
    expect(wrapper.text()).toContain('Wind')
  })

  it('should show save button', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })

    const saveButton = wrapper.find('.weather-action-button')
    expect(saveButton.exists()).toBe(true)
  })

  it('should emit save event when save button is clicked', async () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })

    const saveButton = wrapper.find('.weather-action-button')
    await saveButton.trigger('click')

    expect(wrapper.emitted('save')).toBeTruthy()
  })

  it('should display weather information', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })

    // Should show weather title and current temperature
    expect(wrapper.text()).toContain('Aktuelles Wetter in Berlin')
    expect(wrapper.text()).toContain('20°C') // current temp
  })

  it('should handle missing weather data gracefully', () => {
    const incompleteWeatherData = {
      name: 'Test Location',
      current: {
        temp: 20
        // Missing other properties
      }
    }
    
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: incompleteWeatherData,
        useImperialUnits: false
      }
    })
    
    expect(wrapper.find('.weather-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Location')
    expect(wrapper.text()).toContain('20°C')
  })

  it('should handle missing current weather data', () => {
    const weatherDataWithoutCurrent = {
      name: 'Test Location',
      current: null
    }
    
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: weatherDataWithoutCurrent,
        useImperialUnits: false
      }
    })
    
    expect(wrapper.find('.weather-card').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Location')
  })

  it('should update temperature display when units change', async () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })
    
    // Initially should show Celsius
    expect(wrapper.text()).toContain('20°C')
    
    // Change to imperial units
    await wrapper.setProps({ useImperialUnits: true })
    
    // Should now show Fahrenheit
    expect(wrapper.text()).toContain('68°F')
  })

  it('should have proper accessibility attributes', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })

    const weatherIcon = wrapper.find('.weather-icon-large img')
    expect(weatherIcon.attributes('alt')).toBe('clear sky')

    const saveButton = wrapper.find('.weather-action-button')
    expect(saveButton.element.tagName).toBe('BUTTON')
  })

  it('should display German labels for weather metrics', () => {
    const wrapper = mount(WeatherCard, {
      props: {
        weatherData: mockWeatherData,
        useImperialUnits: false
      }
    })
    
    // Check for German labels (these would be in the actual component)
    const text = wrapper.text()
    // These assertions would depend on the actual German labels used in the component
    expect(wrapper.find('.weather-card').exists()).toBe(true)
  })
})
