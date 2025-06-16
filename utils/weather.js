import { fetchWeatherApi } from 'openmeteo';

/**
 * Weather utility functions for the weather app
 * Handles API calls, data transformation, and weather code mappings
 */

/**
 * Fetch comprehensive weather data using Open-Meteo API with openmeteo package
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @param {Object} locationInfo - Location information with cityName and fullName
 * @returns {Promise<Object>} - Transformed weather data
 */
export async function getWeatherData(lat, lng, locationInfo) {
    try {
        const params = {
            latitude: lat,
            longitude: lng,
            current: [
                'temperature_2m', 'relative_humidity_2m', 'apparent_temperature', 'is_day',
                'wind_speed_10m', 'wind_direction_10m', 'wind_gusts_10m', 'snowfall',
                'showers', 'rain', 'precipitation', 'weather_code', 'cloud_cover',
                'pressure_msl', 'surface_pressure'
            ],
            hourly: [
                'temperature_2m', 'dew_point_2m', 'apparent_temperature', 'precipitation_probability',
                'precipitation', 'rain', 'showers', 'relative_humidity_2m', 'snowfall', 'snow_depth',
                'vapour_pressure_deficit', 'et0_fao_evapotranspiration', 'evapotranspiration',
                'visibility', 'cloud_cover_high', 'cloud_cover_mid', 'cloud_cover', 'cloud_cover_low',
                'surface_pressure', 'pressure_msl', 'weather_code', 'wind_direction_180m',
                'wind_speed_180m', 'wind_speed_10m', 'wind_speed_80m', 'wind_speed_120m',
                'wind_direction_10m', 'wind_direction_80m', 'wind_direction_120m', 'wind_gusts_10m',
                'temperature_80m', 'temperature_120m', 'temperature_180m', 'soil_temperature_6cm',
                'soil_temperature_18cm', 'soil_temperature_0cm', 'soil_temperature_54cm',
                'soil_moisture_0_to_1cm', 'soil_moisture_1_to_3cm', 'soil_moisture_3_to_9cm',
                'soil_moisture_27_to_81cm', 'soil_moisture_9_to_27cm', 'uv_index', 'is_day',
                'uv_index_clear_sky', 'sunshine_duration', 'wet_bulb_temperature_2m',
                'total_column_integrated_water_vapour', 'lifted_index', 'cape',
                'convective_inhibition', 'freezing_level_height', 'boundary_layer_height',
                'shortwave_radiation', 'direct_radiation', 'diffuse_radiation'
            ],
            daily: [
                'weather_code', 'temperature_2m_max', 'temperature_2m_min', 'apparent_temperature_max',
                'apparent_temperature_min', 'uv_index_clear_sky_max', 'uv_index_max', 'sunshine_duration',
                'daylight_duration', 'sunset', 'sunrise', 'rain_sum', 'showers_sum', 'snowfall_sum',
                'precipitation_sum', 'precipitation_hours', 'precipitation_probability_max',
                'wind_gusts_10m_max', 'wind_speed_10m_max', 'shortwave_radiation_sum',
                'wind_direction_10m_dominant', 'et0_fao_evapotranspiration'
            ],
            models: 'best_match',
            timezone: 'auto',
            forecast_days: 8,
            past_days: 1
        };

        console.log('🌍 Fetching weather data with openmeteo package for:', locationInfo);

        const responses = await fetchWeatherApi('https://api.open-meteo.com/v1/forecast', params);
        const response = responses[0];

        // Attributes for timezone and location
        const utcOffsetSeconds = response.utcOffsetSeconds();
        const current = response.current();
        const hourly = response.hourly();
        const daily = response.daily();

        console.log('📊 Raw API Response processed successfully');

        // Transform openmeteo package response to match our component structure
        // Create time arrays using the proper openmeteo package method
        const range = (start, stop, step) =>
            Array.from({ length: (stop - start) / step }, (_, i) => start + i * step);

        const hourlyTime = range(Number(hourly.time()), Number(hourly.timeEnd()), hourly.interval()).map(
            (t) => new Date((t + utcOffsetSeconds) * 1000)
        );

        const dailyTime = range(Number(daily.time()), Number(daily.timeEnd()), daily.interval()).map(
            (t) => new Date((t + utcOffsetSeconds) * 1000)
        );

        // Get air quality and pollen data
        const airQualityData = await getAirQualityData(lat, lng);
        const pollenData = await getPollenData(lat, lng);

        const weatherData = {
            name: locationInfo.cityName,
            fullName: locationInfo.fullName,
            coords: { lat, lng },
            id: Date.now(),
            current: {
                temp: current.variables(0).value(),
                feels_like: current.variables(2).value(),
                humidity: current.variables(1).value(),
                pressure: current.variables(13).value(),
                wind_speed: current.variables(4).value() / 3.6, // Convert km/h to m/s for consistency
                wind_deg: current.variables(5).value(),
                wind_gust: current.variables(6).value(),
                visibility: hourly.variables(13).valuesArray()[0] / 1000, // Convert m to km
                dew_point: hourly.variables(1).valuesArray()[0],
                cloud_cover: current.variables(12).value(),
                weather: [{
                    id: current.variables(11).value(),
                    main: getWeatherConditionFromCode(current.variables(11).value()),
                    description: getWeatherDescriptionFromCode(current.variables(11).value()),
                    icon: getWeatherIcon(current.variables(11).value(), current.variables(3).value())
                }]
            },
            hourly: {
                time: hourlyTime,
                temperature_2m: Array.from(hourly.variables(0).valuesArray()),
                dew_point_2m: Array.from(hourly.variables(1).valuesArray()),
                apparent_temperature: Array.from(hourly.variables(2).valuesArray()),
                precipitation_probability: Array.from(hourly.variables(3).valuesArray()),
                precipitation: Array.from(hourly.variables(4).valuesArray()),
                rain: Array.from(hourly.variables(5).valuesArray()),
                showers: Array.from(hourly.variables(6).valuesArray()),
                relative_humidity_2m: Array.from(hourly.variables(7).valuesArray()),
                snowfall: Array.from(hourly.variables(8).valuesArray()),
                snow_depth: Array.from(hourly.variables(9).valuesArray()),
                vapour_pressure_deficit: Array.from(hourly.variables(10).valuesArray()),
                et0_fao_evapotranspiration: Array.from(hourly.variables(11).valuesArray()),
                evapotranspiration: Array.from(hourly.variables(12).valuesArray()),
                visibility: Array.from(hourly.variables(13).valuesArray()),
                cloud_cover_high: Array.from(hourly.variables(14).valuesArray()),
                cloud_cover_mid: Array.from(hourly.variables(15).valuesArray()),
                cloud_cover: Array.from(hourly.variables(16).valuesArray()),
                cloud_cover_low: Array.from(hourly.variables(17).valuesArray()),
                surface_pressure: Array.from(hourly.variables(18).valuesArray()),
                pressure_msl: Array.from(hourly.variables(19).valuesArray()),
                weather_code: Array.from(hourly.variables(20).valuesArray()),
                wind_direction_180m: Array.from(hourly.variables(21).valuesArray()),
                wind_speed_180m: Array.from(hourly.variables(22).valuesArray()),
                wind_speed_10m: Array.from(hourly.variables(23).valuesArray()),
                wind_speed_80m: Array.from(hourly.variables(24).valuesArray()),
                wind_speed_120m: Array.from(hourly.variables(25).valuesArray()),
                wind_direction_10m: Array.from(hourly.variables(26).valuesArray()),
                wind_direction_80m: Array.from(hourly.variables(27).valuesArray()),
                wind_direction_120m: Array.from(hourly.variables(28).valuesArray()),
                wind_gusts_10m: Array.from(hourly.variables(29).valuesArray()),
                temperature_80m: Array.from(hourly.variables(30).valuesArray()),
                temperature_120m: Array.from(hourly.variables(31).valuesArray()),
                temperature_180m: Array.from(hourly.variables(32).valuesArray()),
                soil_temperature_6cm: Array.from(hourly.variables(33).valuesArray()),
                soil_temperature_18cm: Array.from(hourly.variables(34).valuesArray()),
                soil_temperature_0cm: Array.from(hourly.variables(35).valuesArray()),
                soil_temperature_54cm: Array.from(hourly.variables(36).valuesArray()),
                soil_moisture_0_1cm: Array.from(hourly.variables(37).valuesArray()),
                soil_moisture_1_3cm: Array.from(hourly.variables(38).valuesArray()),
                soil_moisture_3_9cm: Array.from(hourly.variables(39).valuesArray()),
                soil_moisture_27_81cm: Array.from(hourly.variables(40).valuesArray()),
                soil_moisture_9_27cm: Array.from(hourly.variables(41).valuesArray()),
                uv_index: Array.from(hourly.variables(42).valuesArray()),
                is_day: Array.from(hourly.variables(43).valuesArray()),
                uv_index_clear_sky: Array.from(hourly.variables(44).valuesArray()),
                sunshine_duration: Array.from(hourly.variables(45).valuesArray()),
                wet_bulb_temperature_2m: Array.from(hourly.variables(46).valuesArray()),
                total_column_integrated_water_vapour: Array.from(hourly.variables(47).valuesArray()),
                lifted_index: Array.from(hourly.variables(48).valuesArray()),
                cape: Array.from(hourly.variables(49).valuesArray()),
                convective_inhibition: Array.from(hourly.variables(50).valuesArray()),
                freezing_level_height: Array.from(hourly.variables(51).valuesArray()),
                boundary_layer_height: Array.from(hourly.variables(52).valuesArray()),
                shortwave_radiation: Array.from(hourly.variables(53).valuesArray()),
                direct_radiation: Array.from(hourly.variables(54).valuesArray()),
                diffuse_radiation: Array.from(hourly.variables(55).valuesArray()),
                air_quality: airQualityData?.hourly || null,
                pollen: pollenData?.hourly || null
            },
            daily: {
                time: dailyTime,
                weather_code: Array.from(daily.variables(0).valuesArray()),
                temperature_2m_max: Array.from(daily.variables(1).valuesArray()),
                temperature_2m_min: Array.from(daily.variables(2).valuesArray()),
                apparent_temperature_max: Array.from(daily.variables(3).valuesArray()),
                apparent_temperature_min: Array.from(daily.variables(4).valuesArray()),
                uv_index_clear_sky_max: Array.from(daily.variables(5).valuesArray()),
                uv_index_max: Array.from(daily.variables(6).valuesArray()),
                sunshine_duration: Array.from(daily.variables(7).valuesArray()),
                daylight_duration: Array.from(daily.variables(8).valuesArray()),
                sunset: [...Array(daily.variables(9).valuesInt64Length())].map(
                    (_, i) => new Date((Number(daily.variables(9).valuesInt64(i)) + utcOffsetSeconds) * 1000)
                ),
                sunrise: [...Array(daily.variables(10).valuesInt64Length())].map(
                    (_, i) => new Date((Number(daily.variables(10).valuesInt64(i)) + utcOffsetSeconds) * 1000)
                ),
                rain_sum: Array.from(daily.variables(11).valuesArray()),
                showers_sum: Array.from(daily.variables(12).valuesArray()),
                snowfall_sum: Array.from(daily.variables(13).valuesArray()),
                precipitation_sum: Array.from(daily.variables(14).valuesArray()),
                precipitation_hours: Array.from(daily.variables(15).valuesArray()),
                precipitation_probability_max: Array.from(daily.variables(16).valuesArray()),
                wind_gusts_10m_max: Array.from(daily.variables(17).valuesArray()),
                wind_speed_10m_max: Array.from(daily.variables(18).valuesArray()),
                shortwave_radiation_sum: Array.from(daily.variables(19).valuesArray()),
                wind_direction_10m_dominant: Array.from(daily.variables(20).valuesArray()),
                et0_fao_evapotranspiration: Array.from(daily.variables(21).valuesArray())
            }
        };

        return weatherData;
    } catch (error) {
        console.error('Error fetching weather data:', error);
        throw error;
    }
}

/**
 * Fetch air quality data using Open-Meteo Air Quality API
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} - Air quality data
 */
export async function getAirQualityData(lat, lng) {
    try {
        // Build the air quality API URL
        const airQualityUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone&hourly=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi&timezone=auto&forecast_days=8&past_days=1`;

        console.log('🏭 Air Quality API URL:', airQualityUrl);

        const response = await fetch(airQualityUrl);

        if (!response.ok) {
            throw new Error(`Air Quality API request failed: ${response.status} ${response.statusText}`);
        }

        const airQualityData = await response.json();
        console.log('📊 Air Quality API Response:', airQualityData);

        return {
            current: {
                us_aqi: airQualityData.current?.us_aqi || null,
                pm10: airQualityData.current?.pm10 || null,
                pm2_5: airQualityData.current?.pm2_5 || null,
                carbon_monoxide: airQualityData.current?.carbon_monoxide || null,
                nitrogen_dioxide: airQualityData.current?.nitrogen_dioxide || null,
                sulphur_dioxide: airQualityData.current?.sulphur_dioxide || null,
                ozone: airQualityData.current?.ozone || null
            },
            hourly: {
                time: airQualityData.hourly?.time || [],
                pm10: airQualityData.hourly?.pm10 || [],
                pm2_5: airQualityData.hourly?.pm2_5 || [],
                carbon_monoxide: airQualityData.hourly?.carbon_monoxide || [],
                nitrogen_dioxide: airQualityData.hourly?.nitrogen_dioxide || [],
                sulphur_dioxide: airQualityData.hourly?.sulphur_dioxide || [],
                ozone: airQualityData.hourly?.ozone || [],
                us_aqi: airQualityData.hourly?.us_aqi || []
            }
        };
    } catch (error) {
        console.error('Error fetching air quality data:', error);
        return null;
    }
}

/**
 * Fetch pollen data using Open-Meteo Air Quality API (Europe only)
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object|null>} - Pollen data or null if not available
 */
export async function getPollenData(lat, lng) {
    try {
        // Build the pollen API URL (only available in Europe during pollen season)
        const pollenUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lng}&current=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen,ragweed_pollen&timezone=auto&forecast_days=4&domains=cams_europe`;

        console.log('🌸 Pollen API URL:', pollenUrl);

        const response = await fetch(pollenUrl);

        if (!response.ok) {
            console.warn(`Pollen API request failed: ${response.status} ${response.statusText}`);
            return null;
        }

        const pollenData = await response.json();
        console.log('📊 Pollen API Response:', pollenData);

        return {
            current: {
                alder: pollenData.current?.alder_pollen || null,
                birch: pollenData.current?.birch_pollen || null,
                grass: pollenData.current?.grass_pollen || null,
                mugwort: pollenData.current?.mugwort_pollen || null,
                olive: pollenData.current?.olive_pollen || null,
                ragweed: pollenData.current?.ragweed_pollen || null
            },
            hourly: {
                time: pollenData.hourly?.time || [],
                alder: pollenData.hourly?.alder_pollen || [],
                birch: pollenData.hourly?.birch_pollen || [],
                grass: pollenData.hourly?.grass_pollen || [],
                mugwort: pollenData.hourly?.mugwort_pollen || [],
                olive: pollenData.hourly?.olive_pollen || [],
                ragweed: pollenData.hourly?.ragweed_pollen || []
            }
        };
    } catch (error) {
        console.error('Error fetching pollen data:', error);
        return null;
    }
}

/**
 * Get weather condition from Open-Meteo weather code
 * @param {number} code - Weather code
 * @returns {string} - Weather condition
 */
export function getWeatherConditionFromCode(code) {
    const weatherCodes = {
        0: 'Clear',
        1: 'Clear', 2: 'Clear', 3: 'Clear',
        45: 'Fog', 48: 'Fog',
        51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
        56: 'Drizzle', 57: 'Drizzle',
        61: 'Rain', 63: 'Rain', 65: 'Rain',
        66: 'Rain', 67: 'Rain',
        71: 'Snow', 73: 'Snow', 75: 'Snow',
        77: 'Snow', 80: 'Rain', 81: 'Rain', 82: 'Rain',
        85: 'Snow', 86: 'Snow',
        95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm'
    };

    if (code >= 1 && code <= 3) return 'Clouds';
    return weatherCodes[code] || 'Clear';
}

/**
 * Get weather description from Open-Meteo weather code
 * @param {number} code - Weather code
 * @returns {string} - Weather description
 */
export function getWeatherDescriptionFromCode(code) {
    const descriptions = {
        0: 'clear sky',
        1: 'mainly clear', 2: 'partly cloudy', 3: 'overcast',
        45: 'fog', 48: 'depositing rime fog',
        51: 'light drizzle', 53: 'moderate drizzle', 55: 'dense drizzle',
        56: 'light freezing drizzle', 57: 'dense freezing drizzle',
        61: 'slight rain', 63: 'moderate rain', 65: 'heavy rain',
        66: 'light freezing rain', 67: 'heavy freezing rain',
        71: 'slight snow fall', 73: 'moderate snow fall', 75: 'heavy snow fall',
        77: 'snow grains', 80: 'slight rain showers', 81: 'moderate rain showers', 82: 'violent rain showers',
        85: 'slight snow showers', 86: 'heavy snow showers',
        95: 'thunderstorm', 96: 'thunderstorm with slight hail', 99: 'thunderstorm with heavy hail'
    };
    return descriptions[code] || 'clear sky';
}

/**
 * Get weather icon from Open-Meteo weather code
 * @param {number} code - Weather code
 * @param {number} isDay - Day/night indicator
 * @returns {string} - Weather icon code
 */
export function getWeatherIcon(code, isDay) {
    const iconMap = {
        0: isDay ? '01d' : '01n', // clear sky
        1: isDay ? '02d' : '02n', // mainly clear
        2: isDay ? '03d' : '03n', // partly cloudy
        3: '04d', // overcast
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
}
