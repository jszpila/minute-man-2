import { getStorageItem, setStorageItem } from '../../shared/utils/storage';

export interface CachedWeatherData {
  temperature: number;
  temperatureUnit: string;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  pressure: number;
  sunrise: string;
  sunset: string;
  description: string;
  lastUpdated: string;
  lat: number;
  lon: number;
  name: string;
  timestamp: number;
}

const CACHE_KEY = 'WEATHER_CACHE';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const NWS_API = 'https://api.weather.gov';

/**
 * Get cached weather data if still valid (within 1 hour)
 */
export const getCachedWeather = (): CachedWeatherData | null => {
  const cached = getStorageItem<CachedWeatherData>(CACHE_KEY);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached;
  }
  return null;
};

/**
 * Convert NWS pressure (Pa) to mb
 */
const convertPressure = (pascals: number): number => {
  return pascals / 100; // Pa to mb
};

/**
 * Parse compass direction from wind direction value
 */
const parseWindDirection = (direction: string): string => {
  const dirMap: { [key: string]: string } = {
    N: 'N',
    NNE: 'NNE',
    NE: 'NE',
    ENE: 'ENE',
    E: 'E',
    ESE: 'ESE',
    SE: 'SE',
    SSE: 'SSE',
    S: 'S',
    SSW: 'SSW',
    SW: 'SW',
    WSW: 'WSW',
    W: 'W',
    WNW: 'WNW',
    NW: 'NW',
    NNW: 'NNW',
  };
  return dirMap[direction] || direction;
};

/**
 * Format time string (HH:MM format)
 */
const formatTime = (isoString: string): string => {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return isoString;
  }
};

/**
 * Get weather data from NWS API for given coordinates
 */
export const getWeatherData = async (
  lat: number,
  lon: number,
  isMetric: boolean,
  name: string = 'Unknown Location'
): Promise<CachedWeatherData> => {
  try {
    // Step 1: Get grid points for the location
    const pointsUrl = `${NWS_API}/points/${lat},${lon}`;
    const pointsResponse = await fetch(pointsUrl);

    if (!pointsResponse.ok) {
      throw new Error(`NWS Points API error: ${pointsResponse.status} (coordinates may be outside US)`);
    }

    const pointsData = await pointsResponse.json();
    const forecastUrl = pointsData.properties?.forecast;

    if (!forecastUrl) {
      throw new Error('No forecast URL in NWS response');
    }

    // Step 2: Get forecast data
    const forecastResponse = await fetch(forecastUrl);

    if (!forecastResponse.ok) {
      throw new Error(`NWS Forecast API error: ${forecastResponse.status}`);
    }

    const forecastData = await forecastResponse.json();
    const period = forecastData.properties?.periods?.[0]; // Get current period

    if (!period) {
      throw new Error('No forecast periods available in NWS response');
    }

    // Parse temperature unit with fallback
    let tempUnit = period.temperatureUnit === 'F' ? 'F' : 'C';
    let temperature = period.temperature || 0;

    // Convert to metric if needed
    if (isMetric && tempUnit === 'F') {
      temperature = (temperature - 32) * (5 / 9);
      tempUnit = 'C';
    }

    // Parse wind speed with fallback
    const windSpeedString = period.windSpeed || 'calm';
    const windSpeedMatch = windSpeedString.match(/(\d+)/);
    let windSpeed = windSpeedMatch ? parseInt(windSpeedMatch[1], 10) : 0;

    // Convert to metric if needed (currently in mph, convert to km/h)
    if (isMetric) {
      windSpeed = windSpeed * 1.60934; // mph to km/h
    }

    // Cache the data
    const weatherData: CachedWeatherData = {
      temperature,
      temperatureUnit: tempUnit,
      windSpeed,
      windDirection: parseWindDirection(period.windDirection),
      humidity: period.relativeHumidity || 0,
      pressure: period.barometricPressure ? convertPressure(period.barometricPressure) : 0,
      sunrise: period.sunrise ? formatTime(period.sunrise) : 'N/A',
      sunset: period.sunset ? formatTime(period.sunset) : 'N/A',
      description: period.shortForecast,
      lastUpdated: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      lat,
      lon,
      name,
      timestamp: Date.now(),
    };

    // Cache for 1 hour
    setStorageItem(CACHE_KEY, weatherData);

    return weatherData;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Weather fetch error:', errorMessage);
    throw new Error(`Weather error: ${errorMessage}`);
  }
};

/**
 * Get coordinates from location string (ZIP code or city name)
 * Uses a simple approach with Open-Meteo Geocoding API (free, no auth required)
 */
export const getLocationCoordinates = async (
  location: string
): Promise<{ lat: number; lon: number } | null> => {
  try {
    // Try Open-Meteo Geocoding API (free alternative)
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&country=United%20States&limit=1`
    );

    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.results && data.results.length > 0) {
      const result = data.results[0];
      return {
        lat: result.latitude,
        lon: result.longitude,
      };
    }

    return null;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Geocoding error:', errorMessage);
    throw new Error(`Location error: ${errorMessage}`);
  }
};
