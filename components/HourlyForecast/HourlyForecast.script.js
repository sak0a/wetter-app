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

// Import chart utility functions
import {
    createTemperatureChart,
    createPrecipitationChart,
    createWindChart,
    createAirQualityChart,
    createCloudCoverChart as createCloudCoverChartConfig,
    createVisibilityChart as createVisibilityChartConfig,
    createSolarRadiationChart as createSolarRadiationChartConfig,
    formatChartTime,
    getWindDirection,
    filterDataByDay
} from '~/utils/charts.js';

// Import weather utility functions
import {
    getWeatherConditionFromCode,
    getWeatherDescriptionFromCode,
    getWeatherIcon
} from '~/utils/weather.js';

// Import general utility functions
import { formatTempC, formatTempF } from '~/utils/general.js';

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
        const cloudCoverChart = ref(null);
        const visibilityChart = ref(null);
        const solarRadiationChart = ref(null);

        // Chart instances
        let overviewChartInstance = null;
        let precipitationChartInstance = null;
        let windChartInstance = null;
        let airQualityChartInstance = null;
        let cloudCoverChartInstance = null;
        let visibilityChartInstance = null;
        let solarRadiationChartInstance = null;

        const tabs = [
            { id: 'overview', label: 'Übersicht' },
            { id: 'precipitation', label: 'Niederschlag' },
            { id: 'wind', label: 'Wind' },
            { id: 'airquality', label: 'Luftqualität' },
            { id: 'cloudcover', label: 'Bewölkt' },
            { id: 'visibility', label: 'Sichtbarkeit' },
            { id: 'solar', label: 'Sonnenstrahlung' }
        ];

        // Computed properties for daily cards
        const dailyCards = computed(() => {
            if (!props.weatherData?.daily?.time) return [];

            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);

            // Explicitly reference selectedDayIndex.value to make it reactive
            const currentSelectedIndex = selectedDayIndex.value;

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
                    isSelected: currentSelectedIndex === index
                };
            });
        });

        // Helper function to safely slice arrays (handles both regular arrays and typed arrays)
        const safeSlice = (array, startIndex, endIndex) => {
            if (!array) return [];
            // Convert to regular array if it's not already one, then slice
            const regularArray = Array.isArray(array) ? array : Array.from(array);
            return regularArray.slice(startIndex, endIndex);
        };

        // Get hourly data for selected day
        const selectedDayHourlyData = computed(() => {
            if (!props.weatherData?.hourly?.time) return null;

            const startIndex = selectedDayIndex.value * 24;
            const endIndex = startIndex + 24;

            console.log('📅 Selected Day Data Processing:');
            console.log('Selected Day Index:', selectedDayIndex.value);
            console.log('Start Index:', startIndex, 'End Index:', endIndex);
            console.log('🔍 Temperature data type:', typeof props.weatherData.hourly.temperature_2m);
            console.log('🔍 Temperature is array:', Array.isArray(props.weatherData.hourly.temperature_2m));
            console.log('🔍 Temperature constructor:', props.weatherData.hourly.temperature_2m?.constructor?.name);

            const result = {
                time: safeSlice(props.weatherData.hourly.time, startIndex, endIndex),
                temperature_2m: safeSlice(props.weatherData.hourly.temperature_2m, startIndex, endIndex),
                relative_humidity_2m: safeSlice(props.weatherData.hourly.relative_humidity_2m, startIndex, endIndex),
                dew_point_2m: safeSlice(props.weatherData.hourly.dew_point_2m, startIndex, endIndex),
                apparent_temperature: safeSlice(props.weatherData.hourly.apparent_temperature, startIndex, endIndex),
                precipitation_probability: safeSlice(props.weatherData.hourly.precipitation_probability, startIndex, endIndex),
                precipitation: safeSlice(props.weatherData.hourly.precipitation, startIndex, endIndex),
                weather_code: safeSlice(props.weatherData.hourly.weather_code, startIndex, endIndex),
                pressure_msl: safeSlice(props.weatherData.hourly.pressure_msl, startIndex, endIndex),
                surface_pressure: safeSlice(props.weatherData.hourly.surface_pressure, startIndex, endIndex),
                cloud_cover: safeSlice(props.weatherData.hourly.cloud_cover, startIndex, endIndex),
                cloud_cover_low: safeSlice(props.weatherData.hourly.cloud_cover_low, startIndex, endIndex),
                cloud_cover_mid: safeSlice(props.weatherData.hourly.cloud_cover_mid, startIndex, endIndex),
                cloud_cover_high: safeSlice(props.weatherData.hourly.cloud_cover_high, startIndex, endIndex),
                visibility: safeSlice(props.weatherData.hourly.visibility, startIndex, endIndex),
                wind_speed_10m: safeSlice(props.weatherData.hourly.wind_speed_10m, startIndex, endIndex),
                wind_direction_10m: safeSlice(props.weatherData.hourly.wind_direction_10m, startIndex, endIndex),
                wind_gusts_10m: safeSlice(props.weatherData.hourly.wind_gusts_10m, startIndex, endIndex),
                uv_index: safeSlice(props.weatherData.hourly.uv_index, startIndex, endIndex),
                uv_index_clear_sky: safeSlice(props.weatherData.hourly.uv_index_clear_sky, startIndex, endIndex),
                is_day: safeSlice(props.weatherData.hourly.is_day, startIndex, endIndex),
                sunshine_duration: safeSlice(props.weatherData.hourly.sunshine_duration, startIndex, endIndex),
                shortwave_radiation: safeSlice(props.weatherData.hourly.shortwave_radiation, startIndex, endIndex),
                direct_radiation: safeSlice(props.weatherData.hourly.direct_radiation, startIndex, endIndex),
                diffuse_radiation: safeSlice(props.weatherData.hourly.diffuse_radiation, startIndex, endIndex),
                soil_temperature_0cm: safeSlice(props.weatherData.hourly.soil_temperature_0cm, startIndex, endIndex),
                soil_moisture_0_1cm: safeSlice(props.weatherData.hourly.soil_moisture_0_1cm, startIndex, endIndex),
                air_quality: {
                    pm10: safeSlice(props.weatherData.hourly.air_quality?.pm10, startIndex, endIndex),
                    pm2_5: safeSlice(props.weatherData.hourly.air_quality?.pm2_5, startIndex, endIndex),
                    carbon_monoxide: safeSlice(props.weatherData.hourly.air_quality?.carbon_monoxide, startIndex, endIndex),
                    nitrogen_dioxide: safeSlice(props.weatherData.hourly.air_quality?.nitrogen_dioxide, startIndex, endIndex),
                    sulphur_dioxide: safeSlice(props.weatherData.hourly.air_quality?.sulphur_dioxide, startIndex, endIndex),
                    ozone: safeSlice(props.weatherData.hourly.air_quality?.ozone, startIndex, endIndex),
                    us_aqi: safeSlice(props.weatherData.hourly.air_quality?.us_aqi, startIndex, endIndex)
                },
                pollen: props.weatherData.hourly.pollen ? {
                    alder: safeSlice(props.weatherData.hourly.pollen.alder, startIndex, endIndex),
                    birch: safeSlice(props.weatherData.hourly.pollen.birch, startIndex, endIndex),
                    grass: safeSlice(props.weatherData.hourly.pollen.grass, startIndex, endIndex),
                    mugwort: safeSlice(props.weatherData.hourly.pollen.mugwort, startIndex, endIndex),
                    olive: safeSlice(props.weatherData.hourly.pollen.olive, startIndex, endIndex),
                    ragweed: safeSlice(props.weatherData.hourly.pollen.ragweed, startIndex, endIndex)
                } : null
            };

            console.log('📊 Selected Day Result:');
            console.log('UV Index slice:', result.uv_index);
            console.log('Cloud Cover slice:', result.cloud_cover);
            console.log('Air Quality AQI slice:', result.air_quality.us_aqi);
            console.log('☀️ Solar Radiation Debug:');
            console.log('Shortwave radiation slice:', result.shortwave_radiation);
            console.log('Direct radiation slice:', result.direct_radiation);
            console.log('Diffuse radiation slice:', result.diffuse_radiation);
            console.log('Sunshine duration slice:', result.sunshine_duration);

            return result;
        });

        // Helper functions
        const formatTemp = (temp) => {
            if (temp === null || temp === undefined) return 'N/A';
            return props.useImperialUnits
                ? formatTempF(temp)
                : formatTempC(temp);
        };

        const getWeatherIconUrl = (iconCode) => {
            return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
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
            if (!data?.relative_humidity_2m?.[0] && data?.relative_humidity_2m?.[0] !== 0) return 'N/A';
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
            console.log('🌞 UV Index Debug:');
            console.log('Selected day data:', data);
            console.log('UV Index array:', data?.uv_index);
            console.log('UV Index [0]:', data?.uv_index?.[0]);
            if (data?.uv_index?.[0] === undefined || data?.uv_index?.[0] === null) return 'N/A';
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
            return getWindDirection(data.wind_direction_10m[0]);
        };

        const getCurrentCloudCover = () => {
            const data = selectedDayHourlyData.value;
            console.log('☁️ Cloud Cover Debug:');
            console.log('Cloud cover array:', data?.cloud_cover);
            console.log('Cloud cover [0]:', data?.cloud_cover?.[0]);
            if (data?.cloud_cover?.[0] === undefined || data?.cloud_cover?.[0] === null) return 'N/A';
            return `${Math.round(data.cloud_cover[0])}%`;
        };

        const getCurrentAirQuality = () => {
            const data = selectedDayHourlyData.value;
            console.log('🏭 Air Quality Debug:');
            console.log('Air quality data:', data?.air_quality);
            console.log('AQI array:', data?.air_quality?.us_aqi);
            console.log('AQI [0]:', data?.air_quality?.us_aqi?.[0]);
            if (data?.air_quality?.us_aqi?.[0] === undefined || data?.air_quality?.us_aqi?.[0] === null) return 'N/A';
            return Math.round(data.air_quality.us_aqi[0]);
        };

        // Pollen-related functions
        const getCurrentPollenLevel = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.pollen) return 'N/A';

            // Get current hour pollen data (first hour of selected day)
            const currentHour = 0;
            const levels = [
                data.pollen.alder?.[currentHour] || 0,
                data.pollen.birch?.[currentHour] || 0,
                data.pollen.grass?.[currentHour] || 0,
                data.pollen.mugwort?.[currentHour] || 0,
                data.pollen.olive?.[currentHour] || 0,
                data.pollen.ragweed?.[currentHour] || 0
            ];

            const maxLevel = Math.max(...levels);
            return maxLevel > 0 ? Math.round(maxLevel) : 'N/A';
        };

        const getCurrentMainAllergen = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.pollen) return 'Nur in Europa verfügbar';

            const currentHour = 0;
            const pollenTypes = {
                'Erle': data.pollen.alder?.[currentHour] || 0,
                'Birke': data.pollen.birch?.[currentHour] || 0,
                'Gras': data.pollen.grass?.[currentHour] || 0,
                'Beifuß': data.pollen.mugwort?.[currentHour] || 0,
                'Olive': data.pollen.olive?.[currentHour] || 0,
                'Ragweed': data.pollen.ragweed?.[currentHour] || 0
            };

            const maxEntry = Object.entries(pollenTypes).reduce((a, b) =>
                a[1] > b[1] ? a : b
            );

            return maxEntry[1] > 0 ? `Hauptallergie: ${maxEntry[0]}` : 'Keine Belastung';
        };

        const getPollenStatusText = () => {
            const level = getCurrentPollenLevel();
            if (level === 'N/A' || level === 0) return 'Keine Daten';
            if (level <= 1) return 'Niedrig';
            if (level <= 2) return 'Mäßig';
            if (level <= 3) return 'Hoch';
            return 'Sehr hoch';
        };

        // UV Index related functions
        const getUVStatusText = () => {
            const uvIndex = getCurrentUVIndex();
            if (uvIndex === 'N/A' || uvIndex < 1) return 'Minimal';
            if (uvIndex <= 2) return 'Niedrig';
            if (uvIndex <= 5) return 'Mäßig';
            if (uvIndex <= 7) return 'Hoch';
            if (uvIndex <= 10) return 'Sehr hoch';
            return 'Extrem';
        };

        // Additional data functions for new containers
        const getCurrentPrecipitationAmount = () => {
            const data = selectedDayHourlyData.value;
            if (data?.precipitation?.[0] === undefined || data?.precipitation?.[0] === null) return 'N/A';
            return `${data.precipitation[0].toFixed(1)} mm`;
        };

        const getCurrentPrecipitationProbability = () => {
            const data = selectedDayHourlyData.value;
            if (data?.precipitation_probability?.[0] === undefined || data?.precipitation_probability?.[0] === null) return 'N/A';
            return `${Math.round(data.precipitation_probability[0])}%`;
        };

        const getCurrentPrecipitationType = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.precipitation?.[0] || data.precipitation[0] === 0) return 'Kein Niederschlag';
            if (!data?.weather_code?.[0]) return 'Unbekannt';

            const code = data.weather_code[0];
            if ([61, 63, 65, 80, 81, 82].includes(code)) return 'Regen';
            if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Schnee';
            if ([95, 96, 99].includes(code)) return 'Gewitter';
            if ([51, 53, 55, 56, 57].includes(code)) return 'Nieselregen';
            return 'Niederschlag';
        };

        const getCurrentWindGusts = () => {
            const data = selectedDayHourlyData.value;
            if (data?.wind_gusts_10m?.[0] === undefined || data?.wind_gusts_10m?.[0] === null) return 'N/A';
            return `${Math.round(data.wind_gusts_10m[0])} km/h`;
        };

        const getBeaufortScale = () => {
            const data = selectedDayHourlyData.value;
            if (data?.wind_speed_10m?.[0] === undefined || data?.wind_speed_10m?.[0] === null) return 'N/A';

            const windSpeed = data.wind_speed_10m[0];
            if (windSpeed < 1) return '0 - Windstille';
            if (windSpeed < 6) return '1 - Leiser Zug';
            if (windSpeed < 12) return '2 - Leichte Brise';
            if (windSpeed < 20) return '3 - Schwache Brise';
            if (windSpeed < 29) return '4 - Mäßige Brise';
            if (windSpeed < 39) return '5 - Frische Brise';
            if (windSpeed < 50) return '6 - Starker Wind';
            if (windSpeed < 62) return '7 - Steifer Wind';
            if (windSpeed < 75) return '8 - Stürmischer Wind';
            if (windSpeed < 89) return '9 - Sturm';
            if (windSpeed < 103) return '10 - Schwerer Sturm';
            if (windSpeed < 118) return '11 - Orkanartiger Sturm';
            return '12 - Orkan';
        };

        // Air quality component functions
        const getCurrentPM25 = () => {
            const data = selectedDayHourlyData.value;
            if (data?.air_quality?.pm2_5?.[0] === undefined || data?.air_quality?.pm2_5?.[0] === null) return 'N/A';
            return `${Math.round(data.air_quality.pm2_5[0])} µg/m³`;
        };

        const getCurrentPM10 = () => {
            const data = selectedDayHourlyData.value;
            if (data?.air_quality?.pm10?.[0] === undefined || data?.air_quality?.pm10?.[0] === null) return 'N/A';
            return `${Math.round(data.air_quality.pm10[0])} µg/m³`;
        };

        const getCurrentOzone = () => {
            const data = selectedDayHourlyData.value;
            if (data?.air_quality?.ozone?.[0] === undefined || data?.air_quality?.ozone?.[0] === null) return 'N/A';
            return `${Math.round(data.air_quality.ozone[0])} µg/m³`;
        };

        const getCurrentNO2 = () => {
            const data = selectedDayHourlyData.value;
            if (data?.air_quality?.nitrogen_dioxide?.[0] === undefined || data?.air_quality?.nitrogen_dioxide?.[0] === null) return 'N/A';
            return `${Math.round(data.air_quality.nitrogen_dioxide[0])} µg/m³`;
        };

        const getCurrentSO2 = () => {
            const data = selectedDayHourlyData.value;
            if (data?.air_quality?.sulphur_dioxide?.[0] === undefined || data?.air_quality?.sulphur_dioxide?.[0] === null) return 'N/A';
            return `${Math.round(data.air_quality.sulphur_dioxide[0])} µg/m³`;
        };

        const getCurrentCO = () => {
            const data = selectedDayHourlyData.value;
            if (data?.air_quality?.carbon_monoxide?.[0] === undefined || data?.air_quality?.carbon_monoxide?.[0] === null) return 'N/A';
            return `${Math.round(data.air_quality.carbon_monoxide[0])} µg/m³`;
        };

        // Dynamic container system
        const getActiveTabTitle = () => {
            switch (activeTab.value) {
                case 'overview': return 'Wetterdetails';
                case 'precipitation': return 'Niederschlagsdetails';
                case 'wind': return 'Winddetails';
                case 'airquality': return 'Luftqualitätsdetails';
                case 'cloudcover': return 'Bewölkungsdetails';
                case 'visibility': return 'Sichtbarkeitsdetails';
                case 'solar': return 'Sonnenstrahlungsdetails';
                default: return 'Wetterdetails';
            }
        };

        const getActiveTabContainers = () => {
            switch (activeTab.value) {
                case 'overview':
                    return [
                        {
                            key: 'feels-like',
                            icon: '🌡️',
                            title: 'Gefühlte Temperatur',
                            value: getCurrentFeelsLike(),
                            description: 'Wie sich die Temperatur anfühlt'
                        },
                        {
                            key: 'humidity',
                            icon: '💧',
                            title: 'Luftfeuchtigkeit',
                            value: getCurrentHumidity(),
                            description: 'Relative Luftfeuchtigkeit'
                        },
                        {
                            key: 'dew-point',
                            icon: '🌫️',
                            title: 'Taupunkt',
                            value: getCurrentDewPoint(),
                            description: 'Kondensationstemperatur'
                        },
                        {
                            key: 'pressure',
                            icon: '📊',
                            title: 'Luftdruck',
                            value: getCurrentPressure(),
                            description: 'Atmosphärischer Druck'
                        },
                        {
                            key: 'visibility',
                            icon: '👁️',
                            title: 'Sichtweite',
                            value: getCurrentVisibility(),
                            description: 'Horizontale Sichtweite'
                        },
                        {
                            key: 'uv-index',
                            icon: '☀️',
                            title: 'UV-Index',
                            value: getCurrentUVIndex(),
                            description: getUVStatusText()
                        },
                        {
                            key: 'wind',
                            icon: '💨',
                            title: 'Wind',
                            value: getCurrentWindSpeed(),
                            description: `${getCurrentWindDirection()} Richtung`
                        },
                        {
                            key: 'cloud-cover',
                            icon: '☁️',
                            title: 'Bewölkung',
                            value: getCurrentCloudCover(),
                            description: 'Wolkenbedeckung'
                        },
                        {
                            key: 'air-quality',
                            icon: '🏭',
                            title: 'Luftqualität',
                            value: getCurrentAirQuality(),
                            description: 'US AQI Index'
                        },
                        {
                            key: 'pollen',
                            icon: '🌸',
                            title: 'Pollen',
                            value: getCurrentPollenLevel(),
                            description: getCurrentMainAllergen()
                        }
                    ];

                case 'precipitation':
                    return [
                        {
                            key: 'precipitation-amount',
                            icon: '🌧️',
                            title: 'Niederschlagsmenge',
                            value: getCurrentPrecipitationAmount(),
                            description: 'Stündliche Niederschlagsmenge'
                        },
                        {
                            key: 'precipitation-probability',
                            icon: '☔',
                            title: 'Niederschlagswahrscheinlichkeit',
                            value: getCurrentPrecipitationProbability(),
                            description: 'Wahrscheinlichkeit für Niederschlag'
                        },
                        {
                            key: 'precipitation-type',
                            icon: '🌦️',
                            title: 'Niederschlagsart',
                            value: getCurrentPrecipitationType(),
                            description: 'Art des Niederschlags'
                        },
                        {
                            key: 'humidity-precip',
                            icon: '💧',
                            title: 'Luftfeuchtigkeit',
                            value: getCurrentHumidity(),
                            description: 'Relative Luftfeuchtigkeit'
                        },
                        {
                            key: 'cloud-cover-precip',
                            icon: '☁️',
                            title: 'Bewölkung',
                            value: getCurrentCloudCover(),
                            description: 'Wolkenbedeckung'
                        },
                        {
                            key: 'visibility-precip',
                            icon: '👁️',
                            title: 'Sichtweite',
                            value: getCurrentVisibility(),
                            description: 'Horizontale Sichtweite'
                        }
                    ];

                case 'wind':
                    return [
                        {
                            key: 'wind-speed',
                            icon: '💨',
                            title: 'Windgeschwindigkeit',
                            value: getCurrentWindSpeed(),
                            description: 'Aktuelle Windgeschwindigkeit'
                        },
                        {
                            key: 'wind-direction',
                            icon: '🧭',
                            title: 'Windrichtung',
                            value: getCurrentWindDirection(),
                            description: 'Windrichtung in Himmelsrichtung'
                        },
                        {
                            key: 'wind-gusts',
                            icon: '💨',
                            title: 'Windböen',
                            value: getCurrentWindGusts(),
                            description: 'Maximale Windböen'
                        },
                        {
                            key: 'beaufort-scale',
                            icon: '🌪️',
                            title: 'Beaufort-Skala',
                            value: getBeaufortScale(),
                            description: 'Windstärke nach Beaufort'
                        },
                        {
                            key: 'pressure-wind',
                            icon: '📊',
                            title: 'Luftdruck',
                            value: getCurrentPressure(),
                            description: 'Atmosphärischer Druck'
                        },
                        {
                            key: 'visibility-wind',
                            icon: '👁️',
                            title: 'Sichtweite',
                            value: getCurrentVisibility(),
                            description: 'Horizontale Sichtweite'
                        }
                    ];

                case 'airquality':
                    return [
                        {
                            key: 'aqi',
                            icon: '🏭',
                            title: 'US AQI',
                            value: getCurrentAirQuality(),
                            description: 'Luftqualitätsindex'
                        },
                        {
                            key: 'pm25',
                            icon: '🔴',
                            title: 'PM2.5',
                            value: getCurrentPM25(),
                            description: 'Feinstaub (2.5 µm)'
                        },
                        {
                            key: 'pm10',
                            icon: '🟠',
                            title: 'PM10',
                            value: getCurrentPM10(),
                            description: 'Feinstaub (10 µm)'
                        },
                        {
                            key: 'ozone',
                            icon: '🔵',
                            title: 'Ozon',
                            value: getCurrentOzone(),
                            description: 'Bodennahes Ozon'
                        },
                        {
                            key: 'no2',
                            icon: '🟤',
                            title: 'NO₂',
                            value: getCurrentNO2(),
                            description: 'Stickstoffdioxid'
                        },
                        {
                            key: 'so2',
                            icon: '🟡',
                            title: 'SO₂',
                            value: getCurrentSO2(),
                            description: 'Schwefeldioxid'
                        },
                        {
                            key: 'co',
                            icon: '⚫',
                            title: 'CO',
                            value: getCurrentCO(),
                            description: 'Kohlenmonoxid'
                        }
                    ];
                case 'cloudcover':
                    return [
                        {
                            key: 'total-cloud-cover',
                            icon: '☁️',
                            title: 'Gesamtbewölkung',
                            value: getCurrentCloudCover(),
                            description: 'Gesamte Wolkenbedeckung'
                        },
                        {
                            key: 'low-clouds',
                            icon: '🌫️',
                            title: 'Niedrige Wolken',
                            value: getCurrentLowClouds(),
                            description: 'Wolken unter 2 km Höhe'
                        },
                        {
                            key: 'mid-clouds',
                            icon: '☁️',
                            title: 'Mittlere Wolken',
                            value: getCurrentMidClouds(),
                            description: 'Wolken zwischen 2-6 km Höhe'
                        },
                        {
                            key: 'high-clouds',
                            icon: '🌤️',
                            title: 'Hohe Wolken',
                            value: getCurrentHighClouds(),
                            description: 'Wolken über 6 km Höhe'
                        }
                    ];
                case 'visibility':
                    return [
                        {
                            key: 'visibility',
                            icon: '👁️',
                            title: 'Sichtweite',
                            value: getCurrentVisibility(),
                            description: 'Horizontale Sichtweite'
                        },
                        {
                            key: 'visibility-status',
                            icon: '🌫️',
                            title: 'Sichtverhältnisse',
                            value: getVisibilityStatus(),
                            description: 'Bewertung der Sichtverhältnisse'
                        }
                    ];
                case 'solar':
                    return [
                        {
                            key: 'shortwave-radiation',
                            icon: '☀️',
                            title: 'Kurzwellenstrahlung',
                            value: getCurrentShortwaveRadiation(),
                            description: 'Gesamte Sonnenstrahlung'
                        },
                        {
                            key: 'direct-radiation',
                            icon: '🌞',
                            title: 'Direkte Strahlung',
                            value: getCurrentDirectRadiation(),
                            description: 'Direkte Sonnenstrahlung'
                        },
                        {
                            key: 'diffuse-radiation',
                            icon: '🌤️',
                            title: 'Diffuse Strahlung',
                            value: getCurrentDiffuseRadiation(),
                            description: 'Gestreute Sonnenstrahlung'
                        },
                        {
                            key: 'sunshine-duration',
                            icon: '⏱️',
                            title: 'Sonnenscheindauer',
                            value: getCurrentSunshineDuration(),
                            description: 'Stunden mit direkter Sonne'
                        }
                    ];
                default:
                    return [];
            }
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
            if (cloudCoverChartInstance) {
                cloudCoverChartInstance.destroy();
                cloudCoverChartInstance = null;
            }
            if (visibilityChartInstance) {
                visibilityChartInstance.destroy();
                visibilityChartInstance = null;
            }
            if (solarRadiationChartInstance) {
                solarRadiationChartInstance.destroy();
                solarRadiationChartInstance = null;
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
                    case 'cloudcover':
                        createCloudCoverChart();
                        break;
                    case 'visibility':
                        createVisibilityChart();
                        break;
                    case 'solar':
                        createSolarRadiationChart();
                        break;
                }
            });
        };

        // Helper function to get temperature-based color (Blue → Orange → Red spectrum)
        const getTemperatureColor = (temp) => {
            // Temperature ranges: < 16°C blue, < 26°C orange, >= 26°C red
            let r, g, b;

            if (temp < 16) {
                // Blue range for cold temperatures
                // Darker blue for very cold, lighter blue as it approaches 16°C
                const intensity = Math.max(0, Math.min(1, (temp + 10) / 26)); // -10°C to 16°C range
                r = Math.round(59 + (100 - 59) * intensity);    // 59 to 100 (darker to lighter blue)
                g = Math.round(130 + (150 - 130) * intensity);  // 130 to 150
                b = Math.round(246);                            // Keep blue strong
            } else if (temp < 26) {
                // Orange range for mild temperatures (16°C to 26°C)
                const t = (temp - 16) / 10; // 0 to 1 over the 10°C range
                r = Math.round(100 + (255 - 100) * t);  // Transition from light blue to orange
                g = Math.round(150 + (165 - 150) * t);  // 150 to 165
                b = Math.round(246 + (0 - 246) * t);    // 246 to 0 (lose the blue)
            } else {
                // Red range for hot temperatures (>= 26°C)
                const intensity = Math.min(1, (temp - 26) / 14); // 26°C to 40°C range
                r = Math.round(255 + (220 - 255) * intensity);  // 255 to 220 (bright to darker red)
                g = Math.round(165 + (38 - 165) * intensity);   // 165 to 38
                b = Math.round(0 + (38 - 0) * intensity);       // 0 to 38
            }

            return { r, g, b };
        };

        // Helper function to create temperature gradient
        const createTemperatureGradient = (ctx, chartArea, temperatures) => {
            if (!chartArea || !temperatures.length) return null;

            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);

            // Find min and max temperatures for normalization
            const minTemp = Math.min(...temperatures);
            const maxTemp = Math.max(...temperatures);
            const tempRange = maxTemp - minTemp;

            if (tempRange === 0) {
                const color = getTemperatureColor(temperatures[0]);
                gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0.3)`);
                gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0.1)`);
                return gradient;
            }

            // Create gradient stops based on temperature distribution
            const stops = [];
            for (let i = 0; i < temperatures.length; i++) {
                const temp = temperatures[i];
                const position = (temp - minTemp) / tempRange;
                const color = getTemperatureColor(temp);
                stops.push({ position, color });
            }

            // Sort stops by position and add to gradient
            stops.sort((a, b) => a.position - b.position);
            stops.forEach((stop, index) => {
                const normalizedPosition = index / (stops.length - 1);
                gradient.addColorStop(normalizedPosition, `rgba(${stop.color.r}, ${stop.color.g}, ${stop.color.b}, 0.3)`);
            });

            return gradient;
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

            // Get all labels (hours) for full data
            const allLabels = hourlyData.time.map(time => {
                const date = new Date(time);
                return date.toLocaleTimeString('de-DE', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
            });

            // Display labels (show every 2nd hour for readability)
            const displayLabels = hourlyData.time.map((time, index) => {
                if (index % 2 === 0) {
                    const date = new Date(time);
                    return date.toLocaleTimeString('de-DE', {
                        hour: '2-digit',
                        minute: '2-digit'
                    });
                }
                return '';
            });

            // Create temperature gradient
            const temperatures = hourlyData.temperature_2m;

            overviewChartInstance = new ChartJS(ctx, {
                type: 'line',
                data: {
                    labels: displayLabels,
                    datasets: [{
                        label: 'Temperatur',
                        data: temperatures,
                        borderColor: function(context) {
                            const chart = context.chart;
                            const {ctx, chartArea} = chart;
                            if (!chartArea) return 'rgba(255, 206, 84, 1)';

                            // Create dynamic border gradient
                            const gradient = ctx.createLinearGradient(chartArea.left, 0, chartArea.right, 0);
                            temperatures.forEach((temp, index) => {
                                const position = index / (temperatures.length - 1);
                                const color = getTemperatureColor(temp);
                                gradient.addColorStop(position, `rgba(${color.r}, ${color.g}, ${color.b}, 1)`);
                            });
                            return gradient;
                        },
                        backgroundColor: function(context) {
                            const chart = context.chart;
                            const {ctx, chartArea} = chart;
                            if (!chartArea) return 'rgba(255, 206, 84, 0.1)';
                            return createTemperatureGradient(ctx, chartArea, temperatures);
                        },
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 8,
                        pointHoverBorderWidth: 3,
                        pointHoverBorderColor: 'rgba(255, 255, 255, 0.8)',
                        borderWidth: 3
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
                            display: false
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
                            titleFont: {
                                size: 14,
                                weight: 'bold'
                            },
                            bodyFont: {
                                size: 13
                            },
                            callbacks: {
                                title: function(context) {
                                    const index = context[0].dataIndex;
                                    const time = new Date(hourlyData.time[index]);
                                    return time.toLocaleString('de-DE', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
                                },
                                label: function(context) {
                                    const index = context.dataIndex;
                                    const temp = temperatures[index];
                                    const feelsLike = hourlyData.apparent_temperature?.[index];
                                    const humidity = hourlyData.relative_humidity_2m?.[index];
                                    const precipitation = hourlyData.precipitation_probability?.[index];
                                    const precipitationAmount = hourlyData.precipitation?.[index];
                                    const windSpeed = hourlyData.wind_speed_10m?.[index];
                                    const windDirection = hourlyData.wind_direction_10m?.[index];
                                    const pressure = hourlyData.surface_pressure?.[index];
                                    const visibility = hourlyData.visibility?.[index];

                                    const lines = [
                                        `🌡️ Temperatur: ${formatTemp(temp)}`
                                    ];

                                    if (feelsLike !== undefined) {
                                        lines.push(`🤚 Gefühlt: ${formatTemp(feelsLike)}`);
                                    }
                                    if (humidity !== undefined) {
                                        lines.push(`💧 Luftfeuchtigkeit: ${humidity}%`);
                                    }
                                    if (precipitation !== undefined && precipitation > 0) {
                                        lines.push(`☔ Regenwahrscheinlichkeit: ${precipitation}%`);
                                    }
                                    if (precipitationAmount !== undefined && precipitationAmount > 0) {
                                        lines.push(`🌧️ Niederschlag: ${precipitationAmount.toFixed(1)} mm`);
                                    }
                                    if (windSpeed !== undefined) {
                                        let windText = `💨 Wind: ${Math.round(windSpeed)} km/h`;
                                        if (windDirection !== undefined) {
                                            const directions = ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
                                            const dirIndex = Math.round(windDirection / 22.5) % 16;
                                            windText += ` (${directions[dirIndex]})`;
                                        }
                                        lines.push(windText);
                                    }
                                    if (pressure !== undefined) {
                                        lines.push(`🔽 Luftdruck: ${Math.round(pressure)} hPa`);
                                    }
                                    if (visibility !== undefined) {
                                        lines.push(`👁️ Sichtweite: ${(visibility / 1000).toFixed(1)} km`);
                                    }

                                    return lines;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.08)',
                                lineWidth: 1
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
                            grid: {
                                color: 'rgba(255, 255, 255, 0.08)',
                                lineWidth: 1
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)',
                                font: {
                                    size: 11
                                },
                                callback: function(value) {
                                    return formatTemp(value);
                                }
                            },
                            border: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    },
                    animation: {
                        duration: 1500,
                        easing: 'easeInOutQuart'
                    },
                    elements: {
                        point: {
                            hoverBackgroundColor: function(context) {
                                const temp = temperatures[context.dataIndex];
                                const color = getTemperatureColor(temp);
                                return `rgba(${color.r}, ${color.g}, ${color.b}, 0.8)`;
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

        // Helper function to get cardinal direction from degrees
        const getCardinalDirection = (degrees) => {
            const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
            const index = Math.round(degrees / 22.5) % 16;
            return directions[index];
        };

        // Helper function to create wind direction arrow
        const createWindArrow = (direction) => {
            // Create SVG arrow pointing in wind direction
            const svg = `
                <svg width="16" height="16" viewBox="0 0 16 16" style="transform: rotate(${direction}deg);">
                    <path d="M8 2 L12 10 L8 8 L4 10 Z" fill="currentColor" stroke="currentColor" stroke-width="1"/>
                </svg>
            `;
            return `data:image/svg+xml;base64,${btoa(svg)}`;
        };

        // Wind direction arrows plugin
        const windArrowsPlugin = {
            id: 'windArrows',
            afterDatasetsDraw(chart) {
                const { ctx, chartArea, scales } = chart;
                const hourlyData = selectedDayHourlyData.value;

                if (!hourlyData?.wind_direction_10m || !hourlyData?.wind_speed_10m) return;

                ctx.save();

                // Draw arrows above the chart area
                const arrowY = chartArea.top - 30;
                const arrowSize = 12;

                hourlyData.wind_direction_10m.forEach((direction, index) => {
                    if (index % 2 === 0 && direction !== null && direction !== undefined) { // Show every 2nd arrow to match labels
                        const x = scales.x.getPixelForValue(index);

                        if (x >= chartArea.left && x <= chartArea.right) {
                            // Draw arrow
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
                            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                            ctx.lineWidth = 1.5;

                            ctx.save();
                            ctx.translate(x, arrowY);
                            ctx.rotate((direction * Math.PI) / 180);

                            // Draw arrow shape
                            ctx.beginPath();
                            ctx.moveTo(0, -arrowSize/2);
                            ctx.lineTo(arrowSize/3, arrowSize/2);
                            ctx.lineTo(0, arrowSize/3);
                            ctx.lineTo(-arrowSize/3, arrowSize/2);
                            ctx.closePath();
                            ctx.fill();
                            ctx.stroke();

                            ctx.restore();
                        }
                    }
                });

                ctx.restore();
            }
        };

        const createWindChart = () => {
            if (!windChart.value || !selectedDayHourlyData.value) return;

            if (windChartInstance) {
                windChartInstance.destroy();
                windChartInstance = null;
            }

            const ctx = windChart.value.getContext('2d');
            const hourlyData = selectedDayHourlyData.value;

            // Don't register globally - we'll use it as a local plugin

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
                        borderColor: 'rgba(100, 181, 246, 1)',
                        backgroundColor: function(context) {
                            const chart = context.chart;
                            const {ctx, chartArea} = chart;
                            if (!chartArea) return 'rgba(100, 181, 246, 0.1)';

                            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                            gradient.addColorStop(0, 'rgba(100, 181, 246, 0.4)');
                            gradient.addColorStop(1, 'rgba(100, 181, 246, 0.05)');
                            return gradient;
                        },
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 6,
                        pointHoverBorderWidth: 2,
                        pointHoverBorderColor: 'rgba(255, 255, 255, 0.8)',
                        borderWidth: 2.5
                    }, {
                        label: 'Windböen (km/h)',
                        data: hourlyData.wind_gusts_10m,
                        borderColor: 'rgba(255, 193, 7, 1)',
                        backgroundColor: 'rgba(255, 193, 7, 0.1)',
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        borderDash: [8, 4],
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    layout: {
                        padding: {
                            top: 40 // Space for wind arrows
                        }
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            labels: {
                                color: 'rgba(255, 255, 255, 0.8)',
                                font: {
                                    size: 12
                                },
                                usePointStyle: true,
                                pointStyle: 'line'
                            }
                        },
                        tooltip: {
                            enabled: true,
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            titleColor: 'rgba(255, 255, 255, 1)',
                            bodyColor: 'rgba(255, 255, 255, 0.9)',
                            borderColor: 'rgba(100, 181, 246, 0.5)',
                            borderWidth: 2,
                            cornerRadius: 12,
                            padding: 16,
                            displayColors: false,
                            titleFont: {
                                size: 14,
                                weight: 'bold'
                            },
                            bodyFont: {
                                size: 13
                            },
                            callbacks: {
                                title: function(context) {
                                    const index = context[0].dataIndex;
                                    const time = new Date(hourlyData.time[index]);
                                    return time.toLocaleString('de-DE', {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    });
                                },
                                label: function(context) {
                                    const index = context.dataIndex;
                                    const windSpeed = hourlyData.wind_speed_10m?.[index];
                                    const windDirection = hourlyData.wind_direction_10m?.[index];
                                    const windGusts = hourlyData.wind_gusts_10m?.[index];

                                    const lines = [];

                                    if (windSpeed !== undefined) {
                                        lines.push(`💨 Windgeschwindigkeit: ${Math.round(windSpeed)} km/h`);
                                    }

                                    if (windDirection !== undefined) {
                                        const cardinal = getCardinalDirection(windDirection);
                                        lines.push(`🧭 Windrichtung: ${Math.round(windDirection)}° (${cardinal})`);
                                    }

                                    if (windGusts !== undefined && windGusts > windSpeed) {
                                        lines.push(`💨 Windböen: ${Math.round(windGusts)} km/h`);
                                    }

                                    return lines;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.08)',
                                lineWidth: 1
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
                            grid: {
                                color: 'rgba(255, 255, 255, 0.08)',
                                lineWidth: 1
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)',
                                font: {
                                    size: 11
                                },
                                callback: function(value) {
                                    return `${value} km/h`;
                                }
                            },
                            border: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            }
                        }
                    },
                    animation: {
                        duration: 1500,
                        easing: 'easeInOutQuart'
                    }
                },
                plugins: [windArrowsPlugin]
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

        const createCloudCoverChart = () => {
            if (!cloudCoverChart.value || !selectedDayHourlyData.value) return;

            if (cloudCoverChartInstance) {
                cloudCoverChartInstance.destroy();
                cloudCoverChartInstance = null;
            }

            const ctx = cloudCoverChart.value.getContext('2d');
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

            const cloudData = {
                low: hourlyData.cloud_cover_low || [],
                mid: hourlyData.cloud_cover_mid || [],
                high: hourlyData.cloud_cover_high || [],
                total: hourlyData.cloud_cover || []
            };

            const chartConfig = createCloudCoverChartConfig(labels, cloudData);
            cloudCoverChartInstance = new ChartJS(ctx, chartConfig);
        };

        const createVisibilityChart = () => {
            if (!visibilityChart.value || !selectedDayHourlyData.value) return;

            if (visibilityChartInstance) {
                visibilityChartInstance.destroy();
                visibilityChartInstance = null;
            }

            const ctx = visibilityChart.value.getContext('2d');
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

            const chartConfig = createVisibilityChartConfig(labels, hourlyData.visibility || []);
            visibilityChartInstance = new ChartJS(ctx, chartConfig);
        };

        const createSolarRadiationChart = () => {
            if (!solarRadiationChart.value || !selectedDayHourlyData.value) return;

            if (solarRadiationChartInstance) {
                solarRadiationChartInstance.destroy();
                solarRadiationChartInstance = null;
            }

            const ctx = solarRadiationChart.value.getContext('2d');
            const hourlyData = selectedDayHourlyData.value;

            const radiationData = {
                shortwave: hourlyData.shortwave_radiation || [],
                direct: hourlyData.direct_radiation || [],
                diffuse: hourlyData.diffuse_radiation || []
            };

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

            const chartConfig = createSolarRadiationChartConfig(labels, radiationData);
            solarRadiationChartInstance = new ChartJS(ctx, chartConfig);
        };

        // Helper functions for new tabs
        const getCurrentLowClouds = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.cloud_cover_low?.[0]) return 'N/A';
            return `${Math.round(data.cloud_cover_low[0])}%`;
        };

        const getCurrentMidClouds = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.cloud_cover_mid?.[0]) return 'N/A';
            return `${Math.round(data.cloud_cover_mid[0])}%`;
        };

        const getCurrentHighClouds = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.cloud_cover_high?.[0]) return 'N/A';
            return `${Math.round(data.cloud_cover_high[0])}%`;
        };

        const getVisibilityStatus = () => {
            const data = selectedDayHourlyData.value;
            if (!data?.visibility?.[0]) return 'N/A';
            const km = data.visibility[0] / 1000;
            if (km >= 10) return 'Sehr gut';
            if (km >= 4) return 'Gut';
            if (km >= 1) return 'Mäßig';
            return 'Schlecht';
        };

        const getCurrentShortwaveRadiation = () => {
            const data = selectedDayHourlyData.value;

            if (!data?.shortwave_radiation || !Array.isArray(data.shortwave_radiation) || data.shortwave_radiation.length === 0) {
                console.log('❌ Shortwave radiation: no array or empty array');
                return 'N/A';
            }

            // Find current hour index or use peak value during day
            const now = new Date();
            const currentHour = now.getHours();
            let valueIndex = 0;

            // If we have enough data points and it's the current day, use current hour
            if (data.shortwave_radiation.length > currentHour && selectedDayIndex.value === 1) {
                valueIndex = currentHour;
            } else {
                // Otherwise, find the maximum value (peak solar radiation) for the day
                const maxIndex = data.shortwave_radiation.indexOf(Math.max(...data.shortwave_radiation));
                valueIndex = maxIndex >= 0 ? maxIndex : 0;
            }

            const value = data.shortwave_radiation[valueIndex];
            if (value === undefined || value === null) {
                console.log('❌ Shortwave radiation: value is undefined or null');
                return 'N/A';
            }

            const roundedValue = Math.round(value);
            console.log('✅ Shortwave radiation returning value:', roundedValue, 'at index:', valueIndex);
            return `${roundedValue} W/m²`;
        };

        const getCurrentDirectRadiation = () => {
            const data = selectedDayHourlyData.value;

            if (!data?.direct_radiation || !Array.isArray(data.direct_radiation) || data.direct_radiation.length === 0) {
                console.log('❌ Direct radiation: no array or empty array');
                return 'N/A';
            }

            // Find current hour index or use peak value during day
            const now = new Date();
            const currentHour = now.getHours();
            let valueIndex = 0;

            // If we have enough data points and it's the current day, use current hour
            if (data.direct_radiation.length > currentHour && selectedDayIndex.value === 1) {
                valueIndex = currentHour;
            } else {
                // Otherwise, find the maximum value (peak solar radiation) for the day
                const maxIndex = data.direct_radiation.indexOf(Math.max(...data.direct_radiation));
                valueIndex = maxIndex >= 0 ? maxIndex : 0;
            }

            const value = data.direct_radiation[valueIndex];
            if (value === undefined || value === null) {
                console.log('❌ Direct radiation: value is undefined or null');
                return 'N/A';
            }

            const roundedValue = Math.round(value);
            console.log('✅ Direct radiation returning value:', roundedValue, 'at index:', valueIndex);
            return `${roundedValue} W/m²`;
        };

        const getCurrentDiffuseRadiation = () => {
            const data = selectedDayHourlyData.value;

            if (!data?.diffuse_radiation || !Array.isArray(data.diffuse_radiation) || data.diffuse_radiation.length === 0) {
                console.log('❌ Diffuse radiation: no array or empty array');
                return 'N/A';
            }

            // Find current hour index or use peak value during day
            const now = new Date();
            const currentHour = now.getHours();
            let valueIndex = 0;

            // If we have enough data points and it's the current day, use current hour
            if (data.diffuse_radiation.length > currentHour && selectedDayIndex.value === 1) {
                valueIndex = currentHour;
            } else {
                // Otherwise, find the maximum value (peak solar radiation) for the day
                const maxIndex = data.diffuse_radiation.indexOf(Math.max(...data.diffuse_radiation));
                valueIndex = maxIndex >= 0 ? maxIndex : 0;
            }

            const value = data.diffuse_radiation[valueIndex];
            if (value === undefined || value === null) {
                console.log('❌ Diffuse radiation: value is undefined or null');
                return 'N/A';
            }

            const roundedValue = Math.round(value);
            console.log('✅ Diffuse radiation returning value:', roundedValue, 'at index:', valueIndex);
            return `${roundedValue} W/m²`;
        };

        const getCurrentSunshineDuration = () => {
            const data = selectedDayHourlyData.value;

            if (!data?.sunshine_duration || !Array.isArray(data.sunshine_duration) || data.sunshine_duration.length === 0) {
                console.log('❌ Sunshine duration: no array or empty array');
                return 'N/A';
            }

            // For sunshine duration, sum up the total for the day or use current hour
            const now = new Date();
            const currentHour = now.getHours();
            let valueInSeconds = 0;

            // If we have enough data points and it's the current day, use current hour
            if (data.sunshine_duration.length > currentHour && selectedDayIndex.value === 1) {
                valueInSeconds = data.sunshine_duration[currentHour] || 0;
            } else {
                // Otherwise, find the maximum value for the day
                valueInSeconds = Math.max(...data.sunshine_duration.filter(v => v !== null && v !== undefined)) || 0;
            }

            if (valueInSeconds === undefined || valueInSeconds === null) {
                console.log('❌ Sunshine duration: value is undefined or null');
                return 'N/A';
            }

            // Convert seconds to minutes
            const valueInMinutes = Math.round(valueInSeconds / 60);
            console.log('✅ Sunshine duration returning value:', valueInMinutes, 'min (from', valueInSeconds, 'seconds)');
            return `${valueInMinutes} min`;
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
            cloudCoverChart,
            visibilityChart,
            solarRadiationChart,
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
            setActiveTab,
            // Pollen functions
            getCurrentPollenLevel,
            getCurrentMainAllergen,
            getPollenStatusText,
            // UV functions
            getUVStatusText,
            // Dynamic container system
            getActiveTabTitle,
            getActiveTabContainers,
            // Additional data functions
            getCurrentPrecipitationAmount,
            getCurrentPrecipitationProbability,
            getCurrentPrecipitationType,
            getCurrentWindGusts,
            getBeaufortScale,
            getCurrentPM25,
            getCurrentPM10,
            getCurrentOzone,
            getCurrentNO2,
            getCurrentSO2,
            getCurrentCO,
            // New tab functions
            getCurrentLowClouds,
            getCurrentMidClouds,
            getCurrentHighClouds,
            getVisibilityStatus,
            getCurrentShortwaveRadiation,
            getCurrentDirectRadiation,
            getCurrentDiffuseRadiation,
            getCurrentSunshineDuration
        };
    }
};
