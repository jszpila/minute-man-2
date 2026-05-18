/**
 * Local storage utilities for persisting settings and form data
 */

export const StorageKeys = {
  THEME: 'mm_theme',
  FONT_SIZE: 'mm_fontSize',
  UNITS: 'mm_units',
  LANGUAGE: 'mm_language',
  NAV_BURGER: 'mm_navBurger',
  ZERO_CALC_FORM: 'mm_zeroCalcForm',
  MILDOT_CALC_FORM: 'mm_mildotCalcForm',
  HOLDOVER_CALC_FORM: 'mm_holdoverCalcForm',
  ZERO_DISTANCE_DEFAULT: 'mm_zeroDistanceDefault',
  ADJUSTMENT_TYPE_DEFAULT: 'mm_adjustmentTypeDefault',
  ADJUSTMENT_INCREMENT_DEFAULT: 'mm_adjustmentIncrementDefault',
  HOLDOVER_ZERO_DISTANCE_DEFAULT: 'mm_holdoverZeroDistanceDefault',
  HOLDOVER_PROFILE_DEFAULT: 'mm_holdoverProfileDefault',
  HOLDOVER_HEIGHT_OVER_BORE_DEFAULT: 'mm_holdoverHeightOverBoreDefault',
  HOLDOVER_OUTPUT_UNIT_DEFAULT: 'mm_holdoverOutputUnitDefault',
  MILDOT_SIZE_DEFAULT: 'mm_mildotSizeDefault',
  MILDOT_PHYSICAL_SIZE_DEFAULT: 'mm_mildotPhysicalSizeDefault',
  MILDOT_DISTANCE_DEFAULT: 'mm_mildotDistanceDefault',
  SHOT_TIMER_DEFAULT_START_MODE: 'mm_shotTimerDefaultStartMode',
  SHOT_TIMER_DEFAULT_TIMER_MODE: 'mm_shotTimerDefaultTimerMode',
  SHOT_TIMER_DEFAULT_PAR_TIME: 'mm_shotTimerDefaultParTime',
  SHOT_TIMER_DEFAULT_SENSITIVITY: 'mm_shotTimerDefaultSensitivity',
} as const;

export const getStorageItem = <T>(key: string, defaultValue?: T): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) {
      return defaultValue ?? null;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading from localStorage for key "${key}":`, error);
    return defaultValue ?? null;
  }
};

export const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage for key "${key}":`, error);
  }
};

export const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing localStorage item for key "${key}":`, error);
  }
};

export const clearStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};
