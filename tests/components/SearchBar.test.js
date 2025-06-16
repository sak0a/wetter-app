import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import SearchBar from '~/components/SearchBar/SearchBar.vue'

describe('SearchBar Component', () => {
  it('should render search input with placeholder', () => {
    const wrapper = mount(SearchBar)
    
    const input = wrapper.find('input[type="text"]')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toBe('Ort suchen')
  })

  it('should show search icon', () => {
    const wrapper = mount(SearchBar)
    
    const searchIcon = wrapper.find('.search-icon svg')
    expect(searchIcon.exists()).toBe(true)
  })

  it('should update search query on input', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input[type="text"]')
    
    await input.setValue('Berlin')
    
    expect(wrapper.vm.searchQuery).toBe('Berlin')
  })

  it('should emit search event on Enter key press', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input[type="text"]')
    
    await input.setValue('Munich')
    await input.trigger('keyup.enter')
    
    expect(wrapper.emitted('search')).toBeTruthy()
    expect(wrapper.emitted('search')[0]).toEqual(['Munich'])
  })

  it('should not emit search event for empty query', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input[type="text"]')
    
    await input.setValue('   ') // whitespace only
    await input.trigger('keyup.enter')
    
    expect(wrapper.emitted('search')).toBeFalsy()
  })

  it('should show clear button when query exists', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input[type="text"]')
    
    // Initially no clear button
    expect(wrapper.find('.search-clear').exists()).toBe(false)
    
    await input.setValue('Berlin')
    
    // Clear button should appear
    expect(wrapper.find('.search-clear').exists()).toBe(true)
  })

  it('should clear search query when clear button is clicked', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input[type="text"]')
    
    await input.setValue('Berlin')
    expect(wrapper.vm.searchQuery).toBe('Berlin')
    
    const clearButton = wrapper.find('.search-clear')
    await clearButton.trigger('click')
    
    expect(wrapper.vm.searchQuery).toBe('')
  })

  it('should handle focus and blur events', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input[type="text"]')
    
    // Initially not focused
    expect(wrapper.vm.isFocused).toBe(false)
    expect(wrapper.classes()).not.toContain('search-focused')
    
    await input.trigger('focus')
    expect(wrapper.vm.isFocused).toBe(true)
    
    await input.trigger('blur')
    expect(wrapper.vm.isFocused).toBe(false)
  })

  it('should apply focused styling when input is focused', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input[type="text"]')
    
    await input.trigger('focus')
    
    expect(wrapper.classes()).toContain('search-focused')
  })

  it('should accept loading prop', () => {
    const wrapper = mount(SearchBar, {
      props: {
        loading: true
      }
    })
    
    expect(wrapper.props('loading')).toBe(true)
  })

  it('should emit search query as entered (component trims internally)', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input[type="text"]')

    await input.setValue('  Berlin  ')
    await input.trigger('keyup.enter')

    expect(wrapper.emitted('search')[0]).toEqual(['  Berlin  '])
  })

  it('should handle multiple search attempts', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input[type="text"]')
    
    // First search
    await input.setValue('Berlin')
    await input.trigger('keyup.enter')
    
    // Second search
    await input.setValue('Munich')
    await input.trigger('keyup.enter')
    
    expect(wrapper.emitted('search')).toHaveLength(2)
    expect(wrapper.emitted('search')[0]).toEqual(['Berlin'])
    expect(wrapper.emitted('search')[1]).toEqual(['Munich'])
  })

  it('should maintain search query after clear and re-enter', async () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input[type="text"]')
    
    await input.setValue('Berlin')
    
    const clearButton = wrapper.find('.search-clear')
    await clearButton.trigger('click')
    
    expect(wrapper.vm.searchQuery).toBe('')
    expect(wrapper.find('.search-clear').exists()).toBe(false)
    
    await input.setValue('Hamburg')
    expect(wrapper.find('.search-clear').exists()).toBe(true)
  })

  it('should have proper accessibility attributes', () => {
    const wrapper = mount(SearchBar)
    const input = wrapper.find('input[type="text"]')
    
    expect(input.attributes('type')).toBe('text')
    expect(input.attributes('placeholder')).toBe('Ort suchen')
  })
})
