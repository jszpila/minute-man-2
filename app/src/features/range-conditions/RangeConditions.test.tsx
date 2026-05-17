import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import RangeConditions from './RangeConditions';
import { getCachedWeather, getWeatherData } from './weatherService';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../shared/context/AppContext', () => ({
  useAppContext: () => ({
    units: 'merican',
  }),
}));

jest.mock('./weatherService', () => ({
  getCachedWeather: jest.fn(),
  getLocationCoordinates: jest.fn(),
  getWeatherData: jest.fn(),
}));

describe('RangeConditions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCachedWeather as jest.Mock).mockReturnValue(null);
    (getWeatherData as jest.Mock).mockResolvedValue({
      temperature: 72,
      temperatureUnit: 'F',
      windSpeed: 4,
      windDirection: 'N',
      humidity: 50,
      pressure: 1012,
      description: 'Sunny',
      lastUpdated: '10:00 AM',
      lat: 41,
      lon: -87,
      name: 'Current Location',
      timestamp: Date.now(),
    });
  });

  it('requests geolocation when the view loads in geolocation mode', async () => {
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

    render(<RangeConditions />);

    await waitFor(() => {
      expect(getCurrentPosition).toHaveBeenCalled();
    });
  });
});
