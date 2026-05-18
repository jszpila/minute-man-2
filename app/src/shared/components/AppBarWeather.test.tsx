import { act, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppBarWeather from './AppBarWeather';
import {
  getCachedWeather,
  getWeatherData,
  type CachedWeatherData,
} from '../../features/range-conditions/weatherService';

jest.mock('../context/AppContext', () => ({
  useAppContext: () => ({
    showWeatherInAppBar: true,
    units: 'merican',
  }),
}));

jest.mock('../../features/range-conditions/weatherService', () => ({
  getCachedWeather: jest.fn(),
  getWeatherData: jest.fn(),
}));

const cachedWeather: CachedWeatherData = {
  temperature: 72,
  temperatureUnit: 'F',
  windSpeed: 4,
  windDirection: 'N',
  humidity: 50,
  pressure: 1012,
  elevation: 594,
  description: 'Sunny',
  lastUpdated: '10:00 AM',
  lat: 41,
  lon: -87,
  name: 'Current Location',
  timestamp: Date.now(),
};

const refreshedWeather: CachedWeatherData = {
  ...cachedWeather,
  temperature: 68,
  description: 'Cloudy',
  lastUpdated: '10:15 AM',
  timestamp: Date.now() + 1,
};

const mockGeolocation = () => {
  const getCurrentPosition = jest.fn((success: PositionCallback) => {
    success({
      coords: {
        latitude: 41,
        longitude: -87,
      },
    } as GeolocationPosition);
  });

  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: { getCurrentPosition },
  });
};

describe('AppBarWeather', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockGeolocation();
    Object.defineProperty(navigator, 'permissions', {
      configurable: true,
      value: undefined,
    });
    (getCachedWeather as jest.Mock).mockReturnValue(cachedWeather);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps cached weather visible and marks it failed when polling fails', async () => {
    (getWeatherData as jest.Mock).mockRejectedValue(new Error('Network error'));

    render(<AppBarWeather />);

    expect(await screen.findByText('72°')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(15 * 60 * 1000);
    });

    const widget = screen.getByTestId('app-bar-weather');
    expect(widget).toHaveAttribute('data-polling-error', 'true');
    expect(screen.getByText('72°')).toBeInTheDocument();
  });

  it('restores normal state after a failed poll succeeds later', async () => {
    (getWeatherData as jest.Mock)
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce(refreshedWeather);

    render(<AppBarWeather />);

    expect(await screen.findByText('72°')).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(15 * 60 * 1000);
    });

    expect(screen.getByTestId('app-bar-weather')).toHaveAttribute('data-polling-error', 'true');

    await act(async () => {
      jest.advanceTimersByTime(15 * 60 * 1000);
    });

    await waitFor(() => {
      expect(screen.getByText('68°')).toBeInTheDocument();
    });
    expect(screen.getByTestId('app-bar-weather')).toHaveAttribute('data-polling-error', 'false');
  });
});
