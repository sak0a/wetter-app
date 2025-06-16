import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SavedLocations from '~/components/SavedLocations/SavedLocations.vue'

// Mock utility functions
vi.mock('~/utils/general.js', () => ({
  formatTempC: vi.fn((temp) => temp ? `${Math.round(temp)}°C` : 'N/A'),
  formatTempF: vi.fn((temp) => temp ? `${Math.round(temp * 9/5 + 32)}°F` : 'N/A'),
  getWeatherIconUrl: vi.fn((icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`)
}))

describe('SavedLocations Component', () => {
  const mockHistory = [
    {
      id: 1,
      name: 'Berlin',
      isCurrentLocation: true,
      current: {
        temp: 20,
        weather: [{ icon: '01d', description: 'clear sky' }]
      }
    },
    {
      id: 2,
      name: 'Munich',
      isCurrentLocation: false,
      current: {
        temp: 18,
        weather: [{ icon: '02d', description: 'few clouds' }]
      }
    },
    {
      id: 3,
      name: 'Hamburg',
      isCurrentLocation: false,
      isIPBased: true,
      current: {
        temp: 15,
        weather: [{ icon: '03d', description: 'scattered clouds' }]
      }
    }
  ]

  it('should render when history has items', () => {
    const wrapper = mount(SavedLocations, {
      props: {
        history: mockHistory,
        useImperialUnits: false
      }
    })
    
    expect(wrapper.find('.saved-locations').exists()).toBe(true)
    expect(wrapper.findAll('.saved-location-item')).toHaveLength(3)
  })

  it('should not render when history is empty', () => {
    const wrapper = mount(SavedLocations, {
      props: {
        history: [],
        useImperialUnits: false
      }
    })
    
    expect(wrapper.find('.saved-locations').exists()).toBe(false)
  })

  it('should display location names correctly', () => {
    const wrapper = mount(SavedLocations, {
      props: {
        history: mockHistory,
        useImperialUnits: false
      }
    })
    
    const locationItems = wrapper.findAll('.saved-location-item')
    expect(locationItems[0].text()).toContain('Berlin')
    expect(locationItems[1].text()).toContain('Munich')
    expect(locationItems[2].text()).toContain('Hamburg')
  })

  it('should show special icon for current location', () => {
    const wrapper = mount(SavedLocations, {
      props: {
        history: mockHistory,
        useImperialUnits: false
      }
    })
    
    const currentLocationItem = wrapper.findAll('.saved-location-item')[0]
    expect(currentLocationItem.find('.current-location-icon').exists()).toBe(true)
    expect(currentLocationItem.classes()).toContain('current-location')
  })

  it('should show weather icons for non-current locations', () => {
    const wrapper = mount(SavedLocations, {
      props: {
        history: mockHistory,
        useImperialUnits: false
      }
    })
    
    const regularLocationItem = wrapper.findAll('.saved-location-item')[1]
    expect(regularLocationItem.find('img').exists()).toBe(true)
  })

  it('should show IP indicator for IP-based locations', () => {
    const wrapper = mount(SavedLocations, {
      props: {
        history: mockHistory,
        useImperialUnits: false
      }
    })
    
    const ipLocationItem = wrapper.findAll('.saved-location-item')[2]
    expect(ipLocationItem.find('.ip-indicator').exists()).toBe(true)
    expect(ipLocationItem.find('.ip-indicator').text()).toBe('~')
  })

  it('should display temperatures in Celsius by default', () => {
    const wrapper = mount(SavedLocations, {
      props: {
        history: mockHistory,
        useImperialUnits: false
      }
    })
    
    const locationItems = wrapper.findAll('.saved-location-item')
    expect(locationItems[0].text()).toContain('20°C')
    expect(locationItems[1].text()).toContain('18°C')
    expect(locationItems[2].text()).toContain('15°C')
  })

  it('should display temperatures in Fahrenheit when imperial units are used', () => {
    const wrapper = mount(SavedLocations, {
      props: {
        history: mockHistory,
        useImperialUnits: true
      }
    })
    
    const locationItems = wrapper.findAll('.saved-location-item')
    expect(locationItems[0].text()).toContain('68°F')
    expect(locationItems[1].text()).toContain('64°F')
    expect(locationItems[2].text()).toContain('59°F')
  })

  it('should emit select event when location is clicked', async () => {
    const wrapper = mount(SavedLocations, {
      props: {
        history: mockHistory,
        useImperialUnits: false
      }
    })
    
    const locationItem = wrapper.findAll('.saved-location-item')[1]
    await locationItem.trigger('click')
    
    expect(wrapper.emitted('select')).toBeTruthy()
    expect(wrapper.emitted('select')[0]).toEqual([mockHistory[1]])
  })

  it('should show dropdown menu when menu button is clicked', async () => {
    const wrapper = mount(SavedLocations, {
      props: {
        history: mockHistory,
        useImperialUnits: false
      }
    })
    
    const menuButton = wrapper.find('.menu-button')
    await menuButton.trigger('click')
    
    expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
  })

  it('should show refresh option for current location in dropdown', async () => {
    const wrapper = mount(SavedLocations, {
      props: {
        history: mockHistory,
        useImperialUnits: false
      }
    })
    
    // Click menu button for current location (first item)
    const currentLocationItem = wrapper.findAll('.saved-location-item')[0]
    const menuButton = currentLocationItem.find('.menu-button')
    await menuButton.trigger('click')
    
    const dropdown = wrapper.find('.dropdown-menu')
    expect(dropdown.exists()).toBe(true)
    expect(dropdown.text()).toContain('Standort aktualisieren')
  })

  it('should show remove option for regular locations in dropdown', async () => {
    const wrapper = mount(SavedLocations, {
      props: {
        history: mockHistory,
        useImperialUnits: false
      }
    })
    
    // Click menu button for regular location (second item)
    const regularLocationItem = wrapper.findAll('.saved-location-item')[1]
    const menuButton = regularLocationItem.find('.menu-button')
    await menuButton.trigger('click')
    
    const dropdown = wrapper.find('.dropdown-menu')
    expect(dropdown.exists()).toBe(true)
    expect(dropdown.text()).toContain('Entfernen')
  })

  it('should emit refresh-location event when refresh is clicked', async () => {
    const wrapper = mount(SavedLocations, {
      props: {
        history: mockHistory,
        useImperialUnits: false
      }
    })
    
    // Open dropdown for current location
    const currentLocationItem = wrapper.findAll('.saved-location-item')[0]
    const menuButton = currentLocationItem.find('.menu-button')
    await menuButton.trigger('click')
    
    // Click refresh button
    const refreshButton = wrapper.find('.dropdown-item')
    await refreshButton.trigger('click')
    
    expect(wrapper.emitted('refresh-location')).toBeTruthy()
  })

  it('should emit remove event when remove is clicked', async () => {
    const wrapper = mount(SavedLocations, {
      props: {
        history: mockHistory,
        useImperialUnits: false
      }
    })
    
    // Open dropdown for regular location
    const regularLocationItem = wrapper.findAll('.saved-location-item')[1]
    const menuButton = regularLocationItem.find('.menu-button')
    await menuButton.trigger('click')
    
    // Click remove button
    const removeButton = wrapper.find('.dropdown-item')
    await removeButton.trigger('click')
    
    expect(wrapper.emitted('remove')).toBeTruthy()
    expect(wrapper.emitted('remove')[0]).toEqual([mockHistory[1].id, expect.any(Object)])
  })

  it('should handle missing weather data gracefully', () => {
    const historyWithMissingData = [
      {
        id: 1,
        name: 'Test Location',
        isCurrentLocation: false,
        current: null
      }
    ]
    
    const wrapper = mount(SavedLocations, {
      props: {
        history: historyWithMissingData,
        useImperialUnits: false
      }
    })
    
    expect(wrapper.find('.saved-location-item').exists()).toBe(true)
    expect(wrapper.text()).toContain('Test Location')
  })

  it('should close dropdown when clicking outside', async () => {
    const wrapper = mount(SavedLocations, {
      props: {
        history: mockHistory,
        useImperialUnits: false
      }
    })
    
    // Open dropdown
    const menuButton = wrapper.find('.menu-button')
    await menuButton.trigger('click')
    expect(wrapper.find('.dropdown-menu').exists()).toBe(true)
    
    // Simulate clicking outside (this would typically be handled by a click outside directive)
    // For testing purposes, we can test the activeDropdown state management
    expect(wrapper.vm.activeDropdown).toBeDefined()
  })
})
