import { getWeatherData } from './weatherService';
import { setStorageItem } from '../../shared/utils/storage';

jest.mock('../../shared/utils/storage', () => ({
  getStorageItem: jest.fn(),
  setStorageItem: jest.fn(),
}));

describe('weatherService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    globalThis.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        current: {
          temperature_2m: 72,
          relative_humidity_2m: 55,
          surface_pressure: 1008.4,
          weather_code: 2,
          wind_speed_10m: 7,
          wind_direction_10m: 225,
        },
        elevation: 181,
      }),
    }) as jest.Mock;
  });

  it('maps Open-Meteo current conditions including humidity, pressure, and elevation', async () => {
    const weather = await getWeatherData(41, -87, false, 'Test Range');

    expect(weather).toEqual(
      expect.objectContaining({
        temperature: 72,
        temperatureUnit: 'F',
        windSpeed: 7,
        windDirection: 'SW',
        humidity: 55,
        pressure: 1008.4,
        description: 'Partly cloudy',
        lat: 41,
        lon: -87,
        name: 'Test Range',
      })
    );
    expect(weather.elevation).toBeCloseTo(593.83, 2);
    expect(setStorageItem).toHaveBeenCalledWith('WEATHER_CACHE', weather);
  });

  it('keeps elevation in meters for metric conditions', async () => {
    const weather = await getWeatherData(41, -87, true, 'Test Range');

    expect(weather.temperatureUnit).toBe('C');
    expect(weather.elevation).toBe(181);
  });
});
