import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
  Alert,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useAppContext } from '../../shared/context/AppContext';
import { getWeatherData, getLocationCoordinates, getCachedWeather } from './weatherService';

interface WeatherData {
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
}

interface LocationData {
  lat: number;
  lon: number;
  name: string;
}

const RangeConditions: React.FC = () => {
  const { t } = useTranslation();
  const { units } = useAppContext();

  // State
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationInput, setLocationInput] = useState('');
  const [useGeolocation, setUseGeolocation] = useState(true);

  // Load cached weather on mount
  useEffect(() => {
    const cached = getCachedWeather();
    if (cached) {
      setWeather(cached);
      setLocation({
        lat: cached.lat || 0,
        lon: cached.lon || 0,
        name: cached.name || 'Cached Location',
      });
    }
  }, []);

  // Request geolocation on mount
  useEffect(() => {
    if (useGeolocation && !location) {
      requestGeolocation();
    }
  }, [useGeolocation]);

  const requestGeolocation = () => {
    if (!navigator.geolocation) {
      setError(t('rangeConditions.geolocationNotSupported') || 'Geolocation not supported');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        fetchWeather(latitude, longitude, 'Current Location');
      },
      (geoError) => {
        setError(t('rangeConditions.geolocationError') || `Geolocation error: ${geoError.message}`);
        setLoading(false);
      }
    );
  };

  const handleManualLocationSearch = async () => {
    if (!locationInput.trim()) {
      setError(t('rangeConditions.enterLocation') || 'Please enter a location');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const coords = await getLocationCoordinates(locationInput);
      if (coords) {
        fetchWeather(coords.lat, coords.lon, locationInput);
      } else {
        setError(t('rangeConditions.locationNotFound') || 'Location not found');
        setLoading(false);
      }
    } catch (err) {
      setError(t('rangeConditions.locationSearchError') || 'Error searching location');
      setLoading(false);
    }
  };

  const fetchWeather = async (lat: number, lon: number, name: string) => {
    try {
      const weatherData = await getWeatherData(lat, lon, units === 'metric', name);
      setWeather(weatherData);
      setLocation({ lat, lon, name });
    } catch (err) {
      setError(t('rangeConditions.weatherFetchError') || 'Error fetching weather data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
        <Typography variant="h4">
          {t('rangeConditions.title')}
        </Typography>
        {loading && <CircularProgress size={32} />}
      </Stack>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Location Input */}
      <Stack spacing={2} sx={{ mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel>{t('rangeConditions.locationMethod')}</InputLabel>
              <Select
                value={useGeolocation ? 'geolocation' : 'manual'}
                label={t('rangeConditions.locationMethod')}
                onChange={(e) => setUseGeolocation(e.target.value === 'geolocation')}
              >
                <MenuItem value="geolocation">{t('rangeConditions.useGeolocation')}</MenuItem>
                <MenuItem value="manual">{t('rangeConditions.manualLocation')}</MenuItem>
              </Select>
            </FormControl>

            {!useGeolocation && (
              <>
                <TextField
                  label={t('rangeConditions.enterZipOrCity')}
                  value={locationInput}
                  onChange={(e) => setLocationInput(e.target.value)}
                  placeholder="e.g., 90210 or Los Angeles, CA"
                  fullWidth
                />
                <Button
                  variant="contained"
                  startIcon={<LocationOnIcon />}
                  onClick={handleManualLocationSearch}
                  disabled={loading}
                >
                  {t('rangeConditions.search')}
                </Button>
              </>
            )}

            {useGeolocation && !location && !loading && (
              <Button
                variant="contained"
                startIcon={<LocationOnIcon />}
                onClick={requestGeolocation}
              >
                {t('rangeConditions.getLocation')}
              </Button>
            )}
          </Stack>

      {/* Weather Display */}
      {weather && location && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">{location.name}</Typography>
              <Typography variant="caption" color="textSecondary">
                {t('rangeConditions.lastUpdated')}: {weather.lastUpdated}
              </Typography>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    {t('rangeConditions.temperature')}
                  </Typography>
                  <Typography variant="h6">
                    {Math.round(weather.temperature)}°{weather.temperatureUnit}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="textSecondary">
                    {t('rangeConditions.windSpeed')}
                  </Typography>
                  <Typography variant="h6">
                    {Math.round(weather.windSpeed)} {t(units === 'metric' ? 'rangeConditions.kmh' : 'rangeConditions.mph')}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="textSecondary">
                    {t('rangeConditions.windDirection')}
                  </Typography>
                  <Typography variant="h6">{weather.windDirection}</Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="textSecondary">
                    {t('rangeConditions.humidity')}
                  </Typography>
                  <Typography variant="h6">{weather.humidity}%</Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="textSecondary">
                    {t('rangeConditions.pressure')}
                  </Typography>
                  <Typography variant="h6">{weather.pressure} mb</Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="textSecondary">
                    {t('rangeConditions.condition')}
                  </Typography>
                  <Typography variant="h6">{weather.description}</Typography>
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">
                    {t('rangeConditions.sunrise')}
                  </Typography>
                  <Typography variant="body1">{weather.sunrise}</Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="textSecondary">
                    {t('rangeConditions.sunset')}
                  </Typography>
                  <Typography variant="body1">{weather.sunset}</Typography>
                </Box>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      )}

      {!weather && !loading && !error && (
        <Card>
          <CardContent>
            <Typography color="textSecondary">
              {t('rangeConditions.noData')}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default RangeConditions;
