import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    LineController,
    BarController
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    Filler,
    LineController,
    BarController
);

export default {
    name: 'HourlyForecast',
    props: {
        weatherData: {
            type: Object,
            default: null
        },
        useImperialUnits: {
            type: Boolean,
            default: false
        }
    },
    setup(props) {
        const activeTab = ref('overview');
        const selectedDayIndex = ref(1); // Default to today (index 1, since 0 is yesterday)
        const overviewChart = ref(null);
        const precipitationChart = ref(null);
        const windChart = ref(null);
        const airQualityChart = ref(null);

        // Chart instances
        let overviewChartInstance = null;
        let precipitationChartInstance = null;
        let windChartInstance = null;
        let airQualityChartInstance = null;

        const tabs = [
            { id: 'overview', label: 'Übersicht' },
            { id: 'precipitation', label: 'Niederschlag' },
            { id: 'wind', label: 'Wind' },
            { id: 'airquality', label: 'Luftqualität' }
        ];

        // Computed properties for daily cards
        const dailyCards = computed(() => {
            if (!props.weatherData?.daily?.time) return [];

            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            return props.weatherData.daily.time.map((dateStr, index) => {
                const date = new Date(dateStr);
                const isToday = date.toDateString() === today.toDateString();
                const isYesterday = date.toDateString() === yesterday.toDateString();

                let dayName;
                if (isYesterday) dayName = 'Gestern';
                else if (isToday) dayName = 'Heute';
                else dayName = date.toLocaleDateString('de-DE', { weekday: 'short' });

                return {
                    index,
                    dayName,
                    dayNumber: date.getDate(),
                    tempMax: props.weatherData.daily.temperature_2m_max[index],
                    tempMin: props.weatherData.daily.temperature_2m_min[index],
                    icon: getWeatherIcon(props.weatherData.hourly.weather_code[index * 24] || 0, true),
                    condition: getWeatherCondition(props.weatherData.hourly.weather_code[index * 24] || 0),
                    isToday,
                    isYesterday,
                    isSelected: selectedDayIndex.value === index
                };
            });
        });

        // Get hourly data for selected day
        const selectedDayHourlyData = computed(() => {
            if (!props.weatherData?.hourly?.time) return null;

            const startIndex = selectedDayIndex.value * 24;
            const endIndex = startIndex + 24;

            return {
                time: props.weatherData.hourly.time.slice(startIndex, endIndex),
                temperature_2m: props.weatherData.hourly.temperature_2m.slice(startIndex, endIndex),
                relative_humidity_2m: props.weatherData.hourly.relative_humidity_2m.slice(startIndex, endIndex),
                dew_point_2m: props.weatherData.hourly.dew_point_2m.slice(startIndex, endIndex),
                apparent_temperature: props.weatherData.hourly.apparent_temperature.slice(startIndex, endIndex),
                precipitation_probability: props.weatherData.hourly.precipitation_probability.slice(startIndex, endIndex),
                precipitation: props.weatherData.hourly.precipitation.slice(startIndex, endIndex),
                weather_code: props.weatherData.hourly.weather_code.slice(startIndex, endIndex),
                pressure_msl: props.weatherData.hourly.pressure_msl.slice(startIndex, endIndex),
                surface_pressure: props.weatherData.hourly.surface_pressure.slice(startIndex, endIndex),
                cloud_cover: props.weatherData.hourly.cloud_cover.slice(startIndex, endIndex),
                visibility: props.weatherData.hourly.visibility.slice(startIndex, endIndex),
                wind_speed_10m: props.weatherData.hourly.wind_speed_10m.slice(startIndex, endIndex),
                wind_direction_10m: props.weatherData.hourly.wind_direction_10m.slice(startIndex, endIndex),
                wind_gusts_10m: props.weatherData.hourly.wind_gusts_10m.slice(startIndex, endIndex),
                uv_index: props.weatherData.hourly.uv_index.slice(startIndex, endIndex),
                is_day: props.weatherData.hourly.is_day.slice(startIndex, endIndex),
                air_quality: {
                    pm10: props.weatherData.hourly.air_quality?.pm10?.slice(startIndex, endIndex) || [],
                    pm2_5: props.weatherData.hourly.air_quality?.pm2_5?.slice(startIndex, endIndex) || [],
                    carbon_monoxide: props.weatherData.hourly.air_quality?.carbon_monoxide?.slice(startIndex, endIndex) || [],
                    nitrogen_dioxide: props.weatherData.hourly.air_quality?.nitrogen_dioxide?.slice(startIndex, endIndex) || [],
                    sulphur_dioxide: props.weatherData.hourly.air_quality?.sulphur_dioxide?.slice(startIndex, endIndex) || [],
                    ozone: props.weatherData.hourly.air_quality?.ozone?.slice(startIndex, endIndex) || [],
                    us_aqi: props.weatherData.hourly.air_quality?.us_aqi?.slice(startIndex, endIndex) || []
                }
            };
        });

        // Helper functions
        const formatTemp = (temp) => {
            if (temp === null || temp === undefined) return 'N/A';
            return props.useImperialUnits 
                ? `${Math.round((temp * 9 / 5) + 32)}°F`
                : `${Math.round(temp)}°C`;
        };

        const getWeatherIconUrl = (iconCode) => {
            return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        };

        const getWeatherIcon = (code, isDay) => {
            const iconMap = {
                0: isDay ? '01d' : '01n', // clear sky
                1: isDay ? '02d' : '02n', // mainly clear
                2: isDay ? '03d' : '03n', // partly cloudy
                3: isDay ? '04d' : '04n', // overcast
                45: '50d', // fog
                48: '50d', // depositing rime fog
                51: '09d', // light drizzle
                53: '09d', // moderate drizzle
                55: '09d', // dense drizzle
                56: '09d', // light freezing drizzle
                57: '09d', // dense freezing drizzle
                61: '10d', // slight rain
                63: '10d', // moderate rain
                65: '10d', // heavy rain
                66: '13d', // light freezing rain
                67: '13d', // heavy freezing rain
                71: '13d', // slight snow fall
                73: '13d', // moderate snow fall
                75: '13d', // heavy snow fall
                77: '13d', // snow grains
                80: '09d', // slight rain showers
                81: '09d', // moderate rain showers
                82: '09d', // violent rain showers
                85: '13d', // slight snow showers
                86: '13d', // heavy snow showers
                95: '11d', // thunderstorm
                96: '11d', // thunderstorm with slight hail
                99: '11d'  // thunderstorm with heavy hail
            };
            return iconMap[code] || (isDay ? '01d' : '01n');
        };

        const getWeatherCondition = (code) => {
            const conditionMap = {
                0: 'Klar',
                1: 'Überwiegend klar',
                2: 'Teilweise bewölkt',
                3: 'Bedeckt',
                45: 'Nebel',
                48: 'Gefrierender Nebel',
                51: 'Leichter Nieselregen',
                53: 'Nieselregen',
                55: 'Starker Nieselregen',
                61: 'Leichter Regen',
                63: 'Regen',
                65: 'Starker Regen',
                71: 'Leichter Schneefall',
                73: 'Schneefall',
                75: 'Starker Schneefall',
                80: 'Regenschauer',
                81: 'Starke Regenschauer',
                82: 'Heftige Regenschauer',
                85: 'Schneeschauer',
                86: 'Starke Schneeschauer',
                95: 'Gewitter',
                96: 'Gewitter mit Hagel',
                99: 'Schweres Gewitter mit Hagel'
            };
            return conditionMap[code] || 'Unbekannt';
        };

        // Day selection function
        const selectDay = (dayIndex) => {
            selectedDayIndex.value = dayIndex;
            nextTick(() => {
                createCharts();
            });
        };

        // Current weather detail functions (now based on selected day)
        const getCurrentFeelsLike = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.apparent_temperature?.[0]) return 'N/A';
            return formatTemp(data.apparent_temperature[0]);
        };

        const getCurrentHumidity = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.relative_humidity_2m?.[0]) return 'N/A';
            return `${Math.round(data.relative_humidity_2m[0])}%`;
        };

        const getCurrentDewPoint = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.dew_point_2m?.[0]) return 'N/A';
            return formatTemp(data.dew_point_2m[0]);
        };

        const getCurrentPressure = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.pressure_msl?.[0]) return 'N/A';
            return `${Math.round(data.pressure_msl[0])} hPa`;
        };

        const getCurrentVisibility = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.visibility?.[0]) return 'N/A';
            return `${Math.round(data.visibility[0] / 1000)} km`;
        };

        const getCurrentUVIndex = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.uv_index?.[0]) return 'N/A';
            return Math.round(data.uv_index[0]);
        };

        const getCurrentWindSpeed = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.wind_speed_10m?.[0]) return 'N/A';
            return `${Math.round(data.wind_speed_10m[0])} km/h`;
        };

        const getCurrentWindDirection = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.wind_direction_10m?.[0]) return 'N/A';
            const directions = ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
            const index = Math.round(data.wind_direction_10m[0] / 22.5) % 16;
            return directions[index];
        };

        const getCurrentCloudCover = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.cloud_cover?.[0]) return 'N/A';
            return `${Math.round(data.cloud_cover[0])}%`;
        };

        const getCurrentAirQuality = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.air_quality?.us_aqi?.[0]) return 'N/A';
            return Math.round(data.air_quality.us_aqi[0]);
        };

        const setActiveTab = (tabId) => {
            activeTab.value = tabId;
            // Destroy all charts before creating new one
            destroyAllCharts();
            setTimeout(() => {
                createCharts();
            }, 50);
        };

        // Destroy all chart instances
        const destroyAllCharts = () => {
            if (overviewChartInstance) {
                overviewChartInstance.destroy();
                overviewChartInstance = null;
            }
            if (precipitationChartInstance) {
                precipitationChartInstance.destroy();
                precipitationChartInstance = null;
            }
            if (windChartInstance) {
                windChartInstance.destroy();
                windChartInstance = null;
            }
            if (airQualityChartInstance) {
                airQualityChartInstance.destroy();
                airQualityChartInstance = null;
            }
        };

        // Chart creation functions
        const createCharts = () => {
            if (!selectedDayHourlyData.value) return;

            // Small delay to ensure DOM is ready
            nextTick(() => {
                switch (activeTab.value) {
                    case 'overview':
                        createOverviewChart();
                        break;
                    case 'precipitation':
                        createPrecipitationChart();
                        break;
                    case 'wind':
                        createWindChart();
                        break;
                    case 'airquality':
                        createAirQualityChart();
                        break;
                }
            });
        };

        const createOverviewChart = () => {
            if (!overviewChart.value || !selectedDayHourlyData.value) return;

            // Destroy existing chart
            if (overviewChartInstance) {
                overviewChartInstance.destroy();
                overviewChartInstance = null;
            }

            const ctx = overviewChart.value.getContext('2d');
            const hourlyData = selectedDayHourlyData.value;

            // Get labels (hours) - show every 2nd hour for readability
            const labels = hourlyData.time.map((time, index) => {
                if (index % 2 === 0) {
                    const date = new Date(time);
                    return date.toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
                return '';
            });

            overviewChartInstance = new ChartJS(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Temperatur',
                        data: hourlyData.temperature_2m,
                        borderColor: 'rgba(255, 206, 84, 1)',
                        backgroundColor: 'rgba(255, 206, 84, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)',
                                callback: function(value) {
                                    return formatTemp(value);
                                }
                            }
                        }
                    }
                }
            });
        };

        const createPrecipitationChart = () => {
            if (!precipitationChart.value || !selectedDayHourlyData.value) return;

            if (precipitationChartInstance) {
                precipitationChartInstance.destroy();
                precipitationChartInstance = null;
            }

            const ctx = precipitationChart.value.getContext('2d');
            const hourlyData = selectedDayHourlyData.value;

            const labels = hourlyData.time.map((time, index) => {
                if (index % 2 === 0) {
                    const date = new Date(time);
                    return date.toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
                return '';
            });

            precipitationChartInstance = new ChartJS(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Niederschlag (mm)',
                        data: hourlyData.precipitation,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }, {
                        label: 'Regenwahrscheinlichkeit (%)',
                        data: hourlyData.precipitation_probability,
                        type: 'line',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        yAxisID: 'y1',
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: 'rgba(255, 255, 255, 0.8)'
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false,
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        }
                    }
                }
            });
        };

        const createWindChart = () => {
            if (!windChart.value || !selectedDayHourlyData.value) return;

            if (windChartInstance) {
                windChartInstance.destroy();
                windChartInstance = null;
            }

            const ctx = windChart.value.getContext('2d');
            const hourlyData = selectedDayHourlyData.value;

            const labels = hourlyData.time.map((time, index) => {
                if (index % 2 === 0) {
                    const date = new Date(time);
                    return date.toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
                return '';
            });

            windChartInstance = new ChartJS(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Windgeschwindigkeit (km/h)',
                        data: hourlyData.wind_speed_10m,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    }, {
                        label: 'Windböen (km/h)',
                        data: hourlyData.wind_gusts_10m,
                        borderColor: 'rgba(255, 159, 64, 1)',
                        backgroundColor: 'rgba(255, 159, 64, 0.1)',
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        borderDash: [5, 5]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: 'rgba(255, 255, 255, 0.8)'
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        }
                    }
                }
            });
        };

        const createAirQualityChart = () => {
            if (!airQualityChart.value || !selectedDayHourlyData.value) return;

            if (airQualityChartInstance) {
                airQualityChartInstance.destroy();
                airQualityChartInstance = null;
            }

            const ctx = airQualityChart.value.getContext('2d');
            const hourlyData = selectedDayHourlyData.value;

            const labels = hourlyData.time.map((time, index) => {
                if (index % 2 === 0) {
                    const date = new Date(time);
                    return date.toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
                return '';
            });

            airQualityChartInstance = new ChartJS(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'US AQI',
                        data: hourlyData.air_quality?.us_aqi || [],
                        borderColor: 'rgba(153, 102, 255, 1)',
                        backgroundColor: 'rgba(153, 102, 255, 0.1)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4
                    }, {
                        label: 'PM2.5 (μg/m³)',
                        data: hourlyData.air_quality?.pm2_5 || [],
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.1)',
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: {
                                color: 'rgba(255, 255, 255, 0.8)'
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        },
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: {
                                drawOnChartArea: false,
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        }
                    }
                }
            });
        };

        // Initialize charts on mount
        onMounted(() => {
            setTimeout(() => {
                createCharts();
            }, 100); // Small delay to ensure DOM is fully ready
        });

        // Cleanup on unmount
        onUnmounted(() => {
            destroyAllCharts();
        });

        // Watch for data changes
        watch(() => props.weatherData, () => {
            if (props.weatherData?.hourly) {
                setTimeout(() => {
                    createCharts();
                }, 50);
            }
        }, { deep: true });

        // Watch for selected day changes
        watch(selectedDayIndex, () => {
            setTimeout(() => {
                createCharts();
            }, 50);
        });

        return {
            activeTab,
            tabs,
            dailyCards,
            selectedDayIndex,
            selectedDayHourlyData,
            overviewChart,
            precipitationChart,
            windChart,
            airQualityChart,
            formatTemp,
            getWeatherIconUrl,
            selectDay,
            getCurrentFeelsLike,
            getCurrentHumidity,
            getCurrentDewPoint,
            getCurrentPressure,
            getCurrentVisibility,
            getCurrentUVIndex,
            getCurrentWindSpeed,
            getCurrentWindDirection,
            getCurrentCloudCover,
            getCurrentAirQuality,
            setActiveTab
        };
    }
};
