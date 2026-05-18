import { getStorageItem, setStorageItem } from '../../shared/utils/storage';

export interface CachedWeatherData {
  temperature: number;
  temperatureUnit: string;
  windSpeed: number;
  windDirection: string;
  humidity: number;
  pressure: number;
  elevation: number;
  description: string;
  lastUpdated: string;
  lat: number;
  lon: number;
  name: string;
  timestamp: number;
}

const CACHE_KEY = 'WEATHER_CACHE';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const OPEN_METEO_FORECAST_API = 'https://api.open-meteo.com/v1/forecast';

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
 * Parse compass direction from wind direction value
 */
const parseWindDirection = (degrees: number): string => {
  const directions = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ];
  const index = Math.round(degrees / 22.5) % directions.length;
  return directions[index];
};

const getWeatherDescription = (weatherCode: number): string => {
  const descriptions: Record<number, string> = {
    0: 'Clear sky',
    1: 'Mainly clear',
    2: 'Partly cloudy',
    3: 'Overcast',
    45: 'Fog',
    48: 'Depositing rime fog',
    51: 'Light drizzle',
    53: 'Moderate drizzle',
    55: 'Dense drizzle',
    56: 'Light freezing drizzle',
    57: 'Dense freezing drizzle',
    61: 'Slight rain',
    63: 'Moderate rain',
    65: 'Heavy rain',
    66: 'Light freezing rain',
    67: 'Heavy freezing rain',
    71: 'Slight snow',
    73: 'Moderate snow',
    75: 'Heavy snow',
    77: 'Snow grains',
    80: 'Slight rain showers',
    81: 'Moderate rain showers',
    82: 'Violent rain showers',
    85: 'Slight snow showers',
    86: 'Heavy snow showers',
    95: 'Thunderstorm',
    96: 'Thunderstorm with slight hail',
    99: 'Thunderstorm with heavy hail',
  };

  return descriptions[weatherCode] || 'Unknown';
};

const metersToFeet = (meters: number): number => meters * 3.28084;

const getNumber = (value: unknown, fallback = 0): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/**
 * Get weather data from Open-Meteo for given coordinates
 */
export const getWeatherData = async (
  lat: number,
  lon: number,
  isMetric: boolean,
  name: string = 'Unknown Location'
): Promise<CachedWeatherData> => {
  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: [
        'temperature_2m',
        'relative_humidity_2m',
        'surface_pressure',
        'weather_code',
        'wind_speed_10m',
        'wind_direction_10m',
      ].join(','),
      temperature_unit: isMetric ? 'celsius' : 'fahrenheit',
      wind_speed_unit: isMetric ? 'kmh' : 'mph',
      timezone: 'auto',
    });
    const response = await fetch(`${OPEN_METEO_FORECAST_API}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Open-Meteo Forecast API error: ${response.status}`);
    }

    const data = await response.json();
    const current = data.current;

    if (!current) {
      throw new Error('No current weather data available in Open-Meteo response');
    }

    const elevationMeters = getNumber(data.elevation);
    const elevation = isMetric ? elevationMeters : metersToFeet(elevationMeters);

    // Cache the data
    const weatherData: CachedWeatherData = {
      temperature: getNumber(current.temperature_2m),
      temperatureUnit: isMetric ? 'C' : 'F',
      windSpeed: getNumber(current.wind_speed_10m),
      windDirection: parseWindDirection(getNumber(current.wind_direction_10m)),
      humidity: getNumber(current.relative_humidity_2m),
      pressure: getNumber(current.surface_pressure),
      elevation,
      description: getWeatherDescription(getNumber(current.weather_code)),
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
