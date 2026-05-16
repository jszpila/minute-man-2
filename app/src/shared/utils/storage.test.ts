import { getStorageItem, setStorageItem, StorageKeys } from './storage';

describe('storage utilities', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('setStorageItem and getStorageItem', () => {
    it('stores and retrieves string values', () => {
      const key = StorageKeys.THEME;
      setStorageItem(key, 'light');
      expect(getStorageItem(key)).toBe('light');
    });

    it('stores and retrieves number values', () => {
      const key = StorageKeys.SHOT_TIMER_DEFAULT_SENSITIVITY;
      setStorageItem(key, 75);
      expect(getStorageItem(key)).toBe(75);
    });

    it('stores and retrieves boolean values', () => {
      const key = StorageKeys.NAV_BURGER;
      setStorageItem(key, true);
      expect(getStorageItem(key)).toBe(true);
    });

    it('stores and retrieves complex objects', () => {
      const key = StorageKeys.ZERO_CALC_FORM;
      const value = { distance: 100, adjustment: 5 };
      setStorageItem(key, value);
      const retrieved = getStorageItem(key);
      expect(retrieved).toEqual(value);
    });

    it('returns default value if key not found', () => {
      const key = StorageKeys.THEME;
      const defaultValue = 'light';
      const result = getStorageItem(key, defaultValue);
      expect(result).toBe(defaultValue);
    });

    it('returns null if key not found and no default provided', () => {
      const key = StorageKeys.THEME;
      const result = getStorageItem(key);
      expect(result).toBeNull();
    });

    it('overwrites previous values', () => {
      const key = StorageKeys.SHOT_TIMER_DEFAULT_SENSITIVITY;
      setStorageItem(key, 50);
      expect(getStorageItem(key)).toBe(50);
      setStorageItem(key, 75);
      expect(getStorageItem(key)).toBe(75);
    });

    it('handles null values', () => {
      const key = StorageKeys.THEME;
      setStorageItem(key, null);
      expect(getStorageItem(key)).toBeNull();
    });
  });

  describe('StorageKeys enum', () => {
    it('has expected keys defined', () => {
      expect(StorageKeys.THEME).toBeDefined();
      expect(StorageKeys.LANGUAGE).toBeDefined();
      expect(StorageKeys.UNITS).toBeDefined();
      expect(StorageKeys.NAV_BURGER).toBeDefined();
      expect(StorageKeys.SHOT_TIMER_DEFAULT_SENSITIVITY).toBeDefined();
      expect(StorageKeys.SHOT_TIMER_DEFAULT_START_MODE).toBeDefined();
      expect(StorageKeys.SHOT_TIMER_DEFAULT_TIMER_MODE).toBeDefined();
      expect(StorageKeys.SHOT_TIMER_DEFAULT_PAR_TIME).toBeDefined();
      expect(StorageKeys.ZERO_DISTANCE_DEFAULT).toBeDefined();
    });
  });
});
