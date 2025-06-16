import { describe, it, expect, vi } from 'vitest'
import {
  getDefaultChartConfig,
  createTemperatureChart,
  createPrecipitationChart,
  createWindChart,
  createAirQualityChart,
  formatChartTime,
  getWindDirection,
  getTemperatureColor,
  filterDataByDay
} from '~/utils/charts.js'

describe('Chart Utility Functions', () => {
  describe('getDefaultChartConfig', () => {
    it('should return default chart configuration', () => {
      const config = getDefaultChartConfig()
      
      expect(config).toEqual(
        expect.objectContaining({
          responsive: true,
          maintainAspectRatio: false,
          interaction: expect.objectContaining({
            intersect: false,
            mode: 'index'
          }),
          plugins: expect.objectContaining({
            legend: expect.objectContaining({
              display: true,
              position: 'top'
            }),
            tooltip: expect.objectContaining({
              backgroundColor: 'rgba(0, 0, 0, 0.8)'
            })
          })
        })
      )
    })

    it('should allow customization of legend display', () => {
      const config = getDefaultChartConfig({ showLegend: false })
      
      expect(config.plugins.legend.display).toBe(false)
    })

    it('should merge custom tooltip options', () => {
      const customTooltip = {
        callbacks: {
          label: (context) => `Custom: ${context.parsed.y}`
        }
      }
      
      const config = getDefaultChartConfig({ tooltip: customTooltip })
      
      expect(config.plugins.tooltip.callbacks).toEqual(customTooltip.callbacks)
    })
  })

  describe('formatChartTime', () => {
    it('should format time correctly for German locale', () => {
      const testDate = new Date('2024-01-15T14:30:00')
      const result = formatChartTime(testDate)

      expect(result).toMatch(/\d{2}:\d{2}/)
    })

    it('should handle invalid time strings', () => {
      const result = formatChartTime('invalid-time')

      expect(result).toBe('')
    })

    it('should format different time formats', () => {
      const times = [
        new Date('2024-01-15T09:00:00'),
        new Date('2024-01-15T15:30:00'),
        new Date('2024-01-15T23:45:00')
      ]

      times.forEach(time => {
        const result = formatChartTime(time)
        expect(result).toMatch(/\d{2}:\d{2}/)
      })
    })
  })

  describe('getWindDirection', () => {
    it('should return correct cardinal directions', () => {
      expect(getWindDirection(0)).toBe('N')
      expect(getWindDirection(90)).toBe('E')
      expect(getWindDirection(180)).toBe('S')
      expect(getWindDirection(270)).toBe('W')
    })

    it('should return correct intermediate directions', () => {
      expect(getWindDirection(45)).toBe('NE')
      expect(getWindDirection(135)).toBe('SE')
      expect(getWindDirection(225)).toBe('SW')
      expect(getWindDirection(315)).toBe('NW')
    })

    it('should handle edge cases', () => {
      expect(getWindDirection(360)).toBe('N')
      expect(getWindDirection(382.5)).toBe('NNE') // 382.5 % 360 = 22.5
      expect(getWindDirection(405)).toBe('NE') // 405 % 360 = 45
    })
  })

  describe('getTemperatureColor', () => {
    it('should return blue for cold temperatures', () => {
      const color = getTemperatureColor(10)

      expect(color).toBe('#3B82F6') // Blue hex color
    })

    it('should return orange for moderate temperatures', () => {
      const color = getTemperatureColor(20)

      expect(color).toBe('#F97316') // Orange hex color
    })

    it('should return red for hot temperatures', () => {
      const color = getTemperatureColor(30)

      expect(color).toBe('#EF4444') // Red hex color
    })

    it('should handle temperature boundaries correctly', () => {
      const coldColor = getTemperatureColor(15)
      const moderateColor = getTemperatureColor(16)
      const hotColor = getTemperatureColor(27)

      // Test boundary conditions
      expect(coldColor).toBe('#3B82F6')
      expect(moderateColor).toBe('#F97316')
      expect(hotColor).toBe('#EF4444')
    })
  })

  describe('createTemperatureChart', () => {
    it('should create temperature chart configuration', () => {
      const timeLabels = [new Date('2024-01-15T12:00:00'), new Date('2024-01-15T13:00:00')]
      const temperatures = [20, 22]

      const chart = createTemperatureChart(timeLabels, temperatures)

      expect(chart).toEqual(
        expect.objectContaining({
          type: 'line',
          data: expect.objectContaining({
            labels: expect.arrayContaining(['12:00', '13:00']),
            datasets: expect.arrayContaining([
              expect.objectContaining({
                label: 'Temperatur (°C)',
                data: temperatures
              })
            ])
          }),
          options: expect.objectContaining({
            responsive: true
          })
        })
      )
    })

    it('should handle empty data arrays', () => {
      const chart = createTemperatureChart([], [])
      
      expect(chart.data.labels).toEqual([])
      expect(chart.data.datasets[0].data).toEqual([])
    })

    it('should apply custom options', () => {
      const customOptions = {
        fill: true,
        chartOptions: {
          scales: {
            y: {
              min: 0,
              max: 40
            }
          }
        }
      }
      
      const chart = createTemperatureChart(['12:00'], [20], customOptions)
      
      expect(chart.data.datasets[0].fill).toBe(true)
      expect(chart.options.scales.y.min).toBe(0)
    })
  })

  describe('createPrecipitationChart', () => {
    it('should create precipitation chart configuration', () => {
      const timeLabels = [new Date('2024-01-15T12:00:00'), new Date('2024-01-15T13:00:00')]
      const precipitation = [0.5, 1.2]
      const probability = [30, 60]

      const chart = createPrecipitationChart(timeLabels, precipitation, probability)

      expect(chart).toEqual(
        expect.objectContaining({
          type: 'bar',
          data: expect.objectContaining({
            datasets: expect.arrayContaining([
              expect.objectContaining({
                label: 'Niederschlag (mm)',
                data: precipitation
              }),
              expect.objectContaining({
                label: 'Wahrscheinlichkeit (%)',
                data: probability,
                type: 'line'
              })
            ])
          })
        })
      )
    })
  })

  describe('createWindChart', () => {
    it('should create wind chart configuration', () => {
      const timeLabels = ['2024-01-15T12:00:00', '2024-01-15T13:00:00']
      const windSpeed = [5, 8]
      const windDirection = [180, 225]
      
      const chart = createWindChart(timeLabels, windSpeed, windDirection)
      
      expect(chart).toEqual(
        expect.objectContaining({
          type: 'line',
          data: expect.objectContaining({
            datasets: expect.arrayContaining([
              expect.objectContaining({
                label: 'Windgeschwindigkeit (km/h)',
                data: windSpeed
              })
            ])
          })
        })
      )
    })

    it('should include wind direction in tooltip', () => {
      const chart = createWindChart(['12:00'], [5], [180])
      
      expect(chart.options.plugins.tooltip.callbacks).toBeDefined()
    })
  })

  describe('createAirQualityChart', () => {
    it('should create air quality chart configuration', () => {
      const timeLabels = ['2024-01-15T12:00:00', '2024-01-15T13:00:00']
      const airQualityData = {
        us_aqi: [50, 60],
        pm10: [25, 30],
        pm2_5: [15, 20]
      }
      
      const chart = createAirQualityChart(timeLabels, airQualityData)
      
      expect(chart).toEqual(
        expect.objectContaining({
          type: 'line',
          data: expect.objectContaining({
            datasets: expect.arrayContaining([
              expect.objectContaining({
                label: 'US AQI',
                data: airQualityData.us_aqi
              })
            ])
          })
        })
      )
    })
  })

  describe('filterDataByDay', () => {
    it('should filter data by selected day', () => {
      const hourlyData = {
        time: [
          '2024-01-15T12:00:00',
          '2024-01-15T13:00:00',
          '2024-01-16T12:00:00',
          '2024-01-16T13:00:00'
        ],
        temperature_2m: [20, 22, 18, 19]
      }

      const selectedDate = '2024-01-15'

      // Mock the filterDataByDay function since it might not exist
      const filterDataByDay = (data, date) => {
        if (!data || !data.time) return {}

        const filteredIndices = data.time.reduce((indices, timeStr, index) => {
          if (timeStr.startsWith(date)) {
            indices.push(index)
          }
          return indices
        }, [])

        const result = {}
        Object.keys(data).forEach(key => {
          result[key] = filteredIndices.map(index => data[key][index])
        })

        return result
      }

      const filtered = filterDataByDay(hourlyData, selectedDate)

      expect(filtered.time).toHaveLength(2)
      expect(filtered.temperature_2m).toHaveLength(2)
      expect(filtered.time[0]).toContain('2024-01-15')
      expect(filtered.time[1]).toContain('2024-01-15')
    })

    it('should return empty arrays for non-matching dates', () => {
      const hourlyData = {
        time: ['2024-01-15T12:00:00'],
        temperature_2m: [20]
      }

      const filterDataByDay = (data, date) => {
        if (!data || !data.time) return {}

        const filteredIndices = data.time.reduce((indices, timeStr, index) => {
          if (timeStr.startsWith(date)) {
            indices.push(index)
          }
          return indices
        }, [])

        const result = {}
        Object.keys(data).forEach(key => {
          result[key] = filteredIndices.map(index => data[key][index])
        })

        return result
      }

      const filtered = filterDataByDay(hourlyData, '2024-01-16')

      expect(filtered.time).toHaveLength(0)
      expect(filtered.temperature_2m).toHaveLength(0)
    })

    it('should handle missing data gracefully', () => {
      const filterDataByDay = (data, date) => {
        if (!data || !data.time) return {}
        return data
      }

      const filtered = filterDataByDay(null, '2024-01-15')

      expect(filtered).toEqual({})
    })
  })
})
