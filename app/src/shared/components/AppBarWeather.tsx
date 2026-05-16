import React from 'react';
import { Box, Typography } from '@mui/material';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import AirIcon from '@mui/icons-material/Air';
import CloudIcon from '@mui/icons-material/Cloud';
import ThunderstormIcon from '@mui/icons-material/Thunderstorm';
import UmbrellaIcon from '@mui/icons-material/Umbrella';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import { useAppContext } from '../context/AppContext';
import {
  getCachedWeather,
  getWeatherData,
  type CachedWeatherData,
} from '../../features/range-conditions/weatherService';

const WEATHER_REFRESH_INTERVAL_MS = 15 * 60 * 1000;

const getCurrentPosition = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      maximumAge: WEATHER_REFRESH_INTERVAL_MS,
      timeout: 8000,
    });
  });
};

const hasExpectedUnit = (weather: CachedWeatherData, isMetric: boolean): boolean => {
  return weather.temperatureUnit === (isMetric ? 'C' : 'F');
};

const formatTemperature = (temperature: number): string => {
  const roundedTemperature = Math.round(temperature);
  if (roundedTemperature >= 0 && roundedTemperature < 10) {
    return `${String(roundedTemperature).padStart(2, '0')}°`;
  }
  return `${roundedTemperature}°`;
};

const WeatherIcon: React.FC<{ weather: CachedWeatherData }> = ({ weather }) => {
  const description = weather.description.toLowerCase();
  const isWindy = description.includes('wind') || description.includes('breezy') || weather.windSpeed >= 20;

  if (description.includes('thunder') || description.includes('storm')) {
    return <ThunderstormIcon fontSize="small" titleAccess={weather.description} />;
  }

  if (description.includes('rain') || description.includes('shower') || description.includes('drizzle')) {
    return <UmbrellaIcon fontSize="small" titleAccess={weather.description} />;
  }

  if (
    description.includes('snow') ||
    description.includes('sleet') ||
    description.includes('ice') ||
    description.includes('freez')
  ) {
    return <AcUnitIcon fontSize="small" titleAccess={weather.description} />;
  }

  if (isWindy) {
    return <AirIcon fontSize="small" titleAccess={weather.description} />;
  }

  if (
    description.includes('cloud') ||
    description.includes('overcast') ||
    description.includes('fog') ||
    description.includes('haze')
  ) {
    return <CloudIcon fontSize="small" titleAccess={weather.description} />;
  }

  return <WbSunnyIcon fontSize="small" titleAccess={weather.description} />;
};

const AppBarWeather: React.FC = () => {
  const { showWeatherInAppBar, units } = useAppContext();
  const [weather, setWeather] = React.useState<CachedWeatherData | null>(null);
  const [hasPollingError, setHasPollingError] = React.useState(false);
  const isMetric = units === 'metric';

  React.useEffect(() => {
    let cancelled = false;

    const loadWeather = async (forceRefresh = false) => {
      if (!showWeatherInAppBar || !navigator.geolocation) {
        if (!cancelled) {
          setWeather(null);
          setHasPollingError(false);
        }
        return;
      }

      try {
        if (navigator.permissions?.query) {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          if (permission.state !== 'granted') {
            if (!cancelled) {
              setWeather(null);
              setHasPollingError(false);
            }
            return;
          }
        }

        const cached = getCachedWeather();
        if (!forceRefresh && cached && hasExpectedUnit(cached, isMetric)) {
          if (!cancelled) {
            setWeather(cached);
            setHasPollingError(false);
          }
          return;
        }

        const position = await getCurrentPosition();
        const nextWeather = await getWeatherData(
          position.coords.latitude,
          position.coords.longitude,
          isMetric,
          'Current Location'
        );

        if (!cancelled) {
          setWeather(nextWeather);
          setHasPollingError(false);
        }
      } catch {
        if (!cancelled) {
          setHasPollingError(true);
        }
      }
    };

    loadWeather();
    const refreshInterval = window.setInterval(() => {
      loadWeather(true);
    }, WEATHER_REFRESH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadWeather(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(refreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isMetric, showWeatherInAppBar]);

  if (!showWeatherInAppBar || !weather) {
    return null;
  }

  return (
    <Box
      aria-label={weather.description}
      data-polling-error={hasPollingError}
      data-testid="app-bar-weather"
      sx={{
        alignItems: 'center',
        color: hasPollingError ? 'text.disabled' : 'inherit',
        display: 'inline-flex',
        gap: 0.5,
        mx: 0.5,
        minWidth: 48,
      }}
    >
      <WeatherIcon weather={weather} />
      <Typography
        component="span"
        variant="body2"
        sx={{
          color: 'inherit',
          fontVariantNumeric: 'tabular-nums',
          lineHeight: 1,
          minWidth: '3ch',
          textAlign: 'right',
        }}
      >
        {formatTemperature(weather.temperature)}
      </Typography>
    </Box>
  );
};

export default AppBarWeather;
