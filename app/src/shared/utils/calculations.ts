/**
 * Unit conversion utilities
 * Supports metric and imperial conversions
 */

export const METERS_PER_YARD = 0.9144;
export const INCHES_PER_CENTIMETER = 0.3937008;
export const CENTIMETERS_PER_INCH = 2.54;
export const MILDOT_IMPERIAL_CONSTANT = 27.77;
export const MILDOT_METRIC_CONSTANT = 10;

export type ZeroAdjustmentType = 'moa' | 'mrad';

export const ZERO_DISTANCE_LIMITS = {
  merican: {
    min: 10,
    max: 500,
    step: 5,
  },
  metric: {
    min: 9,
    max: 457,
    step: 5,
  },
} as const;

export const ZERO_ADJUSTMENT_INCREMENTS: Record<ZeroAdjustmentType, string[]> = {
  moa: ['1', '0.5', '0.25'],
  mrad: ['0.1', '0.05', '0.025'],
};

export const DEFAULT_ZERO_ADJUSTMENT_TYPE: ZeroAdjustmentType = 'moa';
export const DEFAULT_ZERO_ADJUSTMENT_INCREMENT = '0.25';

/**
 * Convert yards to meters
 */
export const yardsToMeters = (yards: number): number => yards * METERS_PER_YARD;

/**
 * Convert meters to yards
 */
export const metersToYards = (meters: number): number => meters / METERS_PER_YARD;

/**
 * Convert centimeters to inches
 */
export const centimetersToInches = (cm: number): number => cm * INCHES_PER_CENTIMETER;

/**
 * Convert inches to centimeters
 */
export const inchesToCentimeters = (inches: number): number => inches * CENTIMETERS_PER_INCH;

/**
 * Calculate MOA clicks for zero adjustment
 * Formula: clicks = offset in inches / click value at distance
 */
export const calculateZeroClicks = (offsetInches: number, clickValueInches: number): number => {
  if (clickValueInches === 0) {
    return 0;
  }
  return offsetInches / clickValueInches;
};

/**
 * Calculate click value in inches at a given distance in yards.
 * MOA is approximated as 1 inch per 100 yards per MOA.
 * MRAD is approximated as 1/1000th of the distance.
 */
export const calculateClickValueInches = (
  distanceYards: number,
  adjustmentPerClick: number,
  adjustmentType: ZeroAdjustmentType = DEFAULT_ZERO_ADJUSTMENT_TYPE
): number => {
  if (adjustmentType === 'mrad') {
    return distanceYards * 36 * (adjustmentPerClick / 1000);
  }

  return (distanceYards / 100) * adjustmentPerClick;
};

/**
 * MilDot calculations - Imperial (yards/inches)
 */

export const calculateMilDotDistance_Imperial = (sizeInches: number, mils: number): number => {
  if (mils === 0) return 0;
  return (sizeInches * MILDOT_IMPERIAL_CONSTANT) / mils;
};

export const calculateMilDotSize_Imperial = (distanceYards: number, mils: number): number => {
  return (distanceYards * mils) / MILDOT_IMPERIAL_CONSTANT;
};

export const calculateMilDotMils_Imperial = (sizeInches: number, distanceYards: number): number => {
  if (distanceYards === 0) return 0;
  return (sizeInches * MILDOT_IMPERIAL_CONSTANT) / distanceYards;
};

/**
 * MilDot calculations - Metric (meters/centimeters)
 */

export const calculateMilDotDistance_Metric = (sizeCm: number, mils: number): number => {
  if (mils === 0) return 0;
  return (sizeCm * MILDOT_METRIC_CONSTANT) / mils;
};

export const calculateMilDotSize_Metric = (distanceMeters: number, mils: number): number => {
  return (distanceMeters * mils) / MILDOT_METRIC_CONSTANT;
};

export const calculateMilDotMils_Metric = (sizeCm: number, distanceMeters: number): number => {
  if (distanceMeters === 0) return 0;
  return (sizeCm * MILDOT_METRIC_CONSTANT) / distanceMeters;
};
