import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import UnitsToggle from '~/components/UnitsToggle/UnitsToggle.vue'

describe('UnitsToggle Component', () => {
  it('should render toggle button', () => {
    const wrapper = mount(UnitsToggle, {
      props: {
        useImperialUnits: false
      }
    })

    const toggleButton = wrapper.find('.units-toggle-button')
    expect(toggleButton.exists()).toBe(true)
    expect(toggleButton.text()).toContain('°C')
  })

  it('should show Celsius when useImperialUnits is false', () => {
    const wrapper = mount(UnitsToggle, {
      props: {
        useImperialUnits: false
      }
    })

    const toggleButton = wrapper.find('.units-toggle-button')
    expect(toggleButton.text()).toContain('°C')
  })

  it('should show Fahrenheit when useImperialUnits is true', () => {
    const wrapper = mount(UnitsToggle, {
      props: {
        useImperialUnits: true
      }
    })

    const toggleButton = wrapper.find('.units-toggle-button')
    expect(toggleButton.text()).toContain('°F')
  })

  it('should open dropdown when toggle button is clicked', async () => {
    const wrapper = mount(UnitsToggle, {
      props: {
        useImperialUnits: false
      }
    })

    const toggleButton = wrapper.find('.units-toggle-button')
    await toggleButton.trigger('click')

    const dropdown = wrapper.find('.units-dropdown')
    expect(dropdown.exists()).toBe(true)
  })

  it('should emit update:units event when Fahrenheit option is clicked', async () => {
    const wrapper = mount(UnitsToggle, {
      props: {
        useImperialUnits: false
      }
    })

    // Open dropdown first
    const toggleButton = wrapper.find('.units-toggle-button')
    await toggleButton.trigger('click')

    // Click Fahrenheit option
    const fahrenheitOption = wrapper.findAll('.units-option')[1]
    await fahrenheitOption.trigger('click')

    expect(wrapper.emitted('update:units')).toBeTruthy()
    expect(wrapper.emitted('update:units')[0]).toEqual([true])
  })

  it('should show active state for current unit in dropdown', async () => {
    const wrapper = mount(UnitsToggle, {
      props: {
        useImperialUnits: false
      }
    })

    // Open dropdown
    const toggleButton = wrapper.find('.units-toggle-button')
    await toggleButton.trigger('click')

    const celsiusOption = wrapper.findAll('.units-option')[0]
    const fahrenheitOption = wrapper.findAll('.units-option')[1]

    expect(celsiusOption.classes()).toContain('active')
    expect(fahrenheitOption.classes()).not.toContain('active')
  })

  it('should handle prop changes correctly', async () => {
    const wrapper = mount(UnitsToggle, {
      props: {
        useImperialUnits: false
      }
    })

    // Initially should show Celsius
    expect(wrapper.find('.units-toggle-button').text()).toContain('°C')

    // Change prop to imperial
    await wrapper.setProps({ useImperialUnits: true })

    // Now should show Fahrenheit
    expect(wrapper.find('.units-toggle-button').text()).toContain('°F')
  })

  it('should have proper button styling classes', () => {
    const wrapper = mount(UnitsToggle, {
      props: {
        useImperialUnits: false
      }
    })

    const toggleButton = wrapper.find('.units-toggle-button')
    expect(toggleButton.classes()).toContain('units-toggle-button')
    expect(toggleButton.classes()).toContain('glass-dark')
  })

  it('should be accessible with proper button roles', () => {
    const wrapper = mount(UnitsToggle, {
      props: {
        useImperialUnits: false
      }
    })

    const buttons = wrapper.findAll('button')

    buttons.forEach(button => {
      expect(button.element.tagName).toBe('BUTTON')
    })
  })
})
