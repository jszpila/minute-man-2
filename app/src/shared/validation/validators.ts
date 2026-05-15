/**
 * Validation utilities for form inputs
 */

export interface ValidationError {
  field: string;
  message: string;
}

export const validateNumericInput = (value: string | number | undefined): boolean => {
  if (value === '' || value === undefined) {
    return false;
  }

  const num = Number(value);
  return !isNaN(num) && isFinite(num);
};

export const validatePositiveNumber = (value: string | number | undefined): boolean => {
  if (!validateNumericInput(value)) {
    return false;
  }

  return Number(value) > 0;
};

export const validateNumberRange = (
  value: string | number | undefined,
  min?: number,
  max?: number
): boolean => {
  if (!validateNumericInput(value)) {
    return false;
  }

  const num = Number(value);

  if (min !== undefined && num < min) {
    return false;
  }

  if (max !== undefined && num > max) {
    return false;
  }

  return true;
};

export const validateDecimalPlaces = (value: string | number, places: number): boolean => {
  if (!validateNumericInput(value)) {
    return false;
  }

  const str = String(value);
  const decimalIndex = str.indexOf('.');

  if (decimalIndex === -1) {
    return true;
  }

  return str.length - decimalIndex - 1 <= places;
};

export const formatNumber = (value: number, decimalPlaces: number = 2): string => {
  return value.toFixed(decimalPlaces);
};

export const parseNumericInput = (value: string | number | undefined): number | null => {
  if (!validateNumericInput(value)) {
    return null;
  }

  return Number(value);
};
