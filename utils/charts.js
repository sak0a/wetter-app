/**
 * Chart utility functions for the weather app
 * Handles chart configurations, data formatting, and chart-related helpers
 */

/**
 * Get temperature-based color for charts
 * @param {number} temp - Temperature in Celsius
 * @returns {string} - Color code
 */
export function getTemperatureColor(temp) {
    if (temp < 16) {
        return '#3B82F6'; // Blue for cold
    } else if (temp >= 16 && temp <= 26) {
        return '#F97316'; // Orange for moderate
    } else {
        return '#EF4444'; // Red for hot
    }
}

/**
 * Generate temperature gradient colors for chart datasets
 * @param {Array} temperatures - Array of temperature values
 * @returns {Array} - Array of color codes
 */
export function generateTemperatureGradient(temperatures) {
    return temperatures.map(temp => getTemperatureColor(temp));
}

/**
 * Get wind direction as cardinal direction
 * @param {number} degrees - Wind direction in degrees
 * @returns {string} - Cardinal direction (N, NE, E, etc.)
 */
export function getWindDirection(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

/**
 * Format time for chart labels
 * @param {Date} date - Date object
 * @param {string} format - Format type ('hour', 'day', 'date')
 * @returns {string} - Formatted time string
 */
export function formatChartTime(date, format = 'hour') {
    if (!date || !(date instanceof Date)) return '';
    
    switch (format) {
        case 'hour':
            return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
        case 'day':
            return date.toLocaleDateString('de-DE', { weekday: 'short' });
        case 'date':
            return date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
        default:
            return date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
    }
}

/**
 * Default chart configuration for weather charts
 * @param {Object} options - Chart options
 * @returns {Object} - Chart.js configuration
 */
export function getDefaultChartConfig(options = {}) {
    return {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            intersect: false,
            mode: 'index'
        },
        plugins: {
            legend: {
                display: options.showLegend !== false,
                position: 'top',
                labels: {
                    usePointStyle: true,
                    padding: 20,
                    font: {
                        size: 12
                    }
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 8,
                displayColors: false,
                ...options.tooltip
            }
        },
        scales: {
            x: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                    drawBorder: false
                },
                ticks: {
                    color: '#9CA3AF',
                    font: {
                        size: 11
                    }
                },
                ...options.xScale
            },
            y: {
                grid: {
                    color: 'rgba(255, 255, 255, 0.1)',
                    drawBorder: false
                },
                ticks: {
                    color: '#9CA3AF',
                    font: {
                        size: 11
                    }
                },
                ...options.yScale
            }
        },
        elements: {
            line: {
                tension: 0.4,
                borderWidth: 2
            },
            point: {
                radius: 3,
                hoverRadius: 6,
                borderWidth: 2
            }
        },
        ...options.additional
    };
}

/**
 * Create temperature chart configuration
 * @param {Array} timeLabels - Array of time labels
 * @param {Array} temperatures - Array of temperature values
 * @param {Object} options - Additional options
 * @returns {Object} - Chart.js configuration
 */
export function createTemperatureChart(timeLabels, temperatures, options = {}) {
    const colors = generateTemperatureGradient(temperatures);
    
    return {
        type: 'line',
        data: {
            labels: timeLabels.map(time => formatChartTime(time)),
            datasets: [{
                label: 'Temperatur (°C)',
                data: temperatures,
                borderColor: colors[0] || '#3B82F6',
                backgroundColor: colors.map(color => color + '20'),
                pointBackgroundColor: colors,
                pointBorderColor: colors,
                fill: options.fill || false,
                tension: 0.4
            }]
        },
        options: {
            ...getDefaultChartConfig({
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y}°C`;
                        }
                    }
                },
                yScale: {
                    title: {
                        display: true,
                        text: 'Temperatur (°C)',
                        color: '#9CA3AF'
                    }
                }
            }),
            ...options.chartOptions
        }
    };
}

/**
 * Create precipitation chart configuration
 * @param {Array} timeLabels - Array of time labels
 * @param {Array} precipitation - Array of precipitation values
 * @param {Array} probability - Array of precipitation probability values
 * @param {Object} options - Additional options
 * @returns {Object} - Chart.js configuration
 */
export function createPrecipitationChart(timeLabels, precipitation, probability, options = {}) {
    return {
        type: 'bar',
        data: {
            labels: timeLabels.map(time => formatChartTime(time)),
            datasets: [
                {
                    label: 'Niederschlag (mm)',
                    data: precipitation,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Wahrscheinlichkeit (%)',
                    data: probability,
                    type: 'line',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            ...getDefaultChartConfig({
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `Niederschlag: ${context.parsed.y} mm`;
                            } else {
                                return `Wahrscheinlichkeit: ${context.parsed.y}%`;
                            }
                        }
                    }
                }
            }),
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9CA3AF'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Niederschlag (mm)',
                        color: '#9CA3AF'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#9CA3AF'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Wahrscheinlichkeit (%)',
                        color: '#9CA3AF'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: '#9CA3AF'
                    }
                }
            },
            ...options.chartOptions
        }
    };
}

/**
 * Create wind chart configuration
 * @param {Array} timeLabels - Array of time labels
 * @param {Array} windSpeed - Array of wind speed values
 * @param {Array} windDirection - Array of wind direction values
 * @param {Object} options - Additional options
 * @returns {Object} - Chart.js configuration
 */
export function createWindChart(timeLabels, windSpeed, windDirection, options = {}) {
    return {
        type: 'line',
        data: {
            labels: timeLabels.map(time => formatChartTime(time)),
            datasets: [{
                label: 'Windgeschwindigkeit (km/h)',
                data: windSpeed,
                borderColor: 'rgba(34, 197, 94, 1)',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderWidth: 2,
                fill: false,
                tension: 0.4
            }]
        },
        options: {
            ...getDefaultChartConfig({
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const direction = getWindDirection(windDirection[context.dataIndex]);
                            return [
                                `Geschwindigkeit: ${context.parsed.y} km/h`,
                                `Richtung: ${direction} (${Math.round(windDirection[context.dataIndex])}°)`
                            ];
                        }
                    }
                },
                yScale: {
                    title: {
                        display: true,
                        text: 'Windgeschwindigkeit (km/h)',
                        color: '#9CA3AF'
                    }
                }
            }),
            ...options.chartOptions
        }
    };
}

/**
 * Create air quality chart configuration
 * @param {Array} timeLabels - Array of time labels
 * @param {Object} airQualityData - Air quality data object
 * @param {Object} options - Additional options
 * @returns {Object} - Chart.js configuration
 */
export function createAirQualityChart(timeLabels, airQualityData, options = {}) {
    return {
        type: 'line',
        data: {
            labels: timeLabels.map(time => formatChartTime(time)),
            datasets: [
                {
                    label: 'US AQI',
                    data: airQualityData.us_aqi,
                    borderColor: 'rgba(168, 85, 247, 1)',
                    backgroundColor: 'rgba(168, 85, 247, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y'
                },
                {
                    label: 'PM2.5 (μg/m³)',
                    data: airQualityData.pm2_5,
                    borderColor: 'rgba(239, 68, 68, 1)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            ...getDefaultChartConfig({
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `US AQI: ${context.parsed.y}`;
                            } else {
                                return `PM2.5: ${context.parsed.y} μg/m³`;
                            }
                        }
                    }
                }
            }),
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9CA3AF'
                    }
                },
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'US AQI',
                        color: '#9CA3AF'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#9CA3AF'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'PM2.5 (μg/m³)',
                        color: '#9CA3AF'
                    },
                    grid: {
                        drawOnChartArea: false
                    },
                    ticks: {
                        color: '#9CA3AF'
                    }
                }
            },
            ...options.chartOptions
        }
    };
}

/**
 * Create cloud cover chart configuration (similar to the Bewölkt chart you showed)
 * @param {Array} timeLabels - Array of time labels
 * @param {Object} cloudData - Cloud cover data object with low, mid, high, and total
 * @param {Object} options - Additional options
 * @returns {Object} - Chart.js configuration
 */
export function createCloudCoverChart(timeLabels, cloudData, options = {}) {
    return {
        type: 'bar',
        data: {
            labels: timeLabels.map(time => formatChartTime(time)),
            datasets: [
                {
                    label: 'Niedrige Bewölkung',
                    data: cloudData.low,
                    backgroundColor: 'rgba(135, 206, 250, 0.8)', // Light sky blue
                    borderColor: 'rgba(135, 206, 250, 1)',
                    borderWidth: 1,
                    stack: 'cloud'
                },
                {
                    label: 'Mittlere Bewölkung',
                    data: cloudData.mid,
                    backgroundColor: 'rgba(100, 149, 237, 0.8)', // Cornflower blue
                    borderColor: 'rgba(100, 149, 237, 1)',
                    borderWidth: 1,
                    stack: 'cloud'
                },
                {
                    label: 'Hohe Bewölkung',
                    data: cloudData.high,
                    backgroundColor: 'rgba(72, 61, 139, 0.8)', // Dark slate blue
                    borderColor: 'rgba(72, 61, 139, 1)',
                    borderWidth: 1,
                    stack: 'cloud'
                },
                {
                    label: 'Gesamtbewölkung',
                    data: cloudData.total,
                    type: 'line',
                    borderColor: 'rgba(255, 255, 255, 0.9)',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderWidth: 3,
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointBackgroundColor: 'rgba(255, 255, 255, 1)',
                    pointBorderColor: 'rgba(255, 255, 255, 1)',
                    pointBorderWidth: 2
                }
            ]
        },
        options: {
            ...getDefaultChartConfig({
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 3) {
                                return `Gesamtbewölkung: ${context.parsed.y}%`;
                            } else {
                                const labels = ['Niedrige Bewölkung', 'Mittlere Bewölkung', 'Hohe Bewölkung'];
                                return `${labels[context.datasetIndex]}: ${context.parsed.y}%`;
                            }
                        }
                    }
                }
            }),
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9CA3AF',
                        font: {
                            size: 11
                        }
                    }
                },
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#9CA3AF',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return value + '%';
                        }
                    },
                    title: {
                        display: true,
                        text: 'Bewölkung (%)',
                        color: '#9CA3AF'
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: {
                            size: 12
                        },
                        color: '#9CA3AF'
                    }
                }
            },
            ...options.chartOptions
        }
    };
}

/**
 * Create visibility chart configuration
 * @param {Array} timeLabels - Array of time labels
 * @param {Array} visibilityData - Array of visibility values in meters
 * @param {Object} options - Additional options
 * @returns {Object} - Chart.js configuration
 */
export function createVisibilityChart(timeLabels, visibilityData, options = {}) {
    // Convert visibility from meters to kilometers
    const visibilityKm = visibilityData.map(v => v ? v / 1000 : 0);

    return {
        type: 'line',
        data: {
            labels: timeLabels.map(time => formatChartTime(time)),
            datasets: [{
                label: 'Sichtweite (km)',
                data: visibilityKm,
                borderColor: 'rgba(52, 168, 83, 1)', // Green like your reference
                backgroundColor: function(context) {
                    const chart = context.chart;
                    const {ctx, chartArea} = chart;
                    if (!chartArea) return 'rgba(52, 168, 83, 0.1)';

                    // Create beautiful gradient like your reference image
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(52, 168, 83, 0.8)');   // Strong green at top
                    gradient.addColorStop(0.3, 'rgba(52, 168, 83, 0.6)'); // Medium green
                    gradient.addColorStop(0.7, 'rgba(34, 139, 69, 0.4)'); // Darker green
                    gradient.addColorStop(1, 'rgba(21, 94, 117, 0.2)');   // Blue-green at bottom
                    return gradient;
                },
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 6,
                pointBackgroundColor: 'rgba(52, 168, 83, 1)',
                pointBorderColor: 'rgba(255, 255, 255, 1)',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false // Hide legend like your reference
                },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    titleColor: 'rgba(255, 255, 255, 1)',
                    bodyColor: 'rgba(255, 255, 255, 0.9)',
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                    borderWidth: 1,
                    cornerRadius: 12,
                    padding: 16,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            const km = context.parsed.y;
                            if (km >= 10) {
                                return `Sichtweite: ${km.toFixed(0)} km (Sehr gut)`;
                            } else if (km >= 4) {
                                return `Sichtweite: ${km.toFixed(1)} km (Gut)`;
                            } else if (km >= 1) {
                                return `Sichtweite: ${km.toFixed(1)} km (Mäßig)`;
                            } else {
                                return `Sichtweite: ${km.toFixed(1)} km (Schlecht)`;
                            }
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.08)',
                        lineWidth: 1,
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 11
                        }
                    },
                    border: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.08)',
                        lineWidth: 1,
                        drawBorder: false
                    },
                    ticks: {
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 11
                        },
                        callback: function(value) {
                            return value + ' km';
                        }
                    },
                    border: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    title: {
                        display: true,
                        text: 'Sichtweite (km)',
                        color: 'rgba(255, 255, 255, 0.7)',
                        font: {
                            size: 12
                        }
                    }
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            },
            ...options.chartOptions
        }
    };
}

/**
 * Create solar radiation chart configuration
 * @param {Array} timeLabels - Array of time labels
 * @param {Object} radiationData - Solar radiation data object
 * @param {Object} options - Additional options
 * @returns {Object} - Chart.js configuration
 */
export function createSolarRadiationChart(timeLabels, radiationData, options = {}) {
    return {
        type: 'line',
        data: {
            labels: timeLabels.map(time => formatChartTime(time)),
            datasets: [
                {
                    label: 'Kurzwellenstrahlung (W/m²)',
                    data: radiationData.shortwave,
                    borderColor: 'rgba(255, 165, 0, 1)', // Orange
                    backgroundColor: 'rgba(255, 165, 0, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Direkte Strahlung (W/m²)',
                    data: radiationData.direct,
                    borderColor: 'rgba(255, 215, 0, 1)', // Gold
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                },
                {
                    label: 'Diffuse Strahlung (W/m²)',
                    data: radiationData.diffuse,
                    borderColor: 'rgba(255, 255, 0, 1)', // Yellow
                    backgroundColor: 'rgba(255, 255, 0, 0.1)',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4
                }
            ]
        },
        options: {
            ...getDefaultChartConfig({
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y} W/m²`;
                        }
                    }
                },
                yScale: {
                    title: {
                        display: true,
                        text: 'Strahlung (W/m²)',
                        color: '#9CA3AF'
                    },
                    beginAtZero: true
                }
            }),
            ...options.chartOptions
        }
    };
}

/**
 * Filter chart data for a specific day
 * @param {Array} timeArray - Array of time values
 * @param {Array} dataArray - Array of data values
 * @param {Date} selectedDate - Selected date to filter by
 * @returns {Object} - Filtered time and data arrays
 */
export function filterDataByDay(timeArray, dataArray, selectedDate) {
    const filtered = timeArray.reduce((acc, time, index) => {
        if (time.toDateString() === selectedDate.toDateString()) {
            acc.time.push(time);
            acc.data.push(dataArray[index]);
        }
        return acc;
    }, { time: [], data: [] });

    return filtered;
}
