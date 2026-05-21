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

export type HoldoverFirearmProfile =
  | 'arCarbine'
  | 'traditionalRifle'
  | 'pistol'
  | 'rimfire'
  | 'custom';

export type HoldoverOutputUnit = 'physical' | 'moa' | 'mrad';

export const HOLDOVER_DISTANCE_LIMITS = {
  zero: {
    min: 5,
    max: 300,
  },
  target: {
    min: 1,
    max: 300,
  },
} as const;

export const HOLDOVER_HEIGHT_LIMITS = {
  merican: {
    min: 0.25,
    max: 4,
  },
  metric: {
    min: 0.5,
    max: 10,
  },
} as const;

export const HOLDOVER_PROFILE_HEIGHTS_INCHES: Record<HoldoverFirearmProfile, number> = {
  arCarbine: 2.5,
  traditionalRifle: 1.5,
  pistol: 1,
  rimfire: 1.5,
  custom: 2.5,
};

export const DEFAULT_HOLDOVER_PROFILE: HoldoverFirearmProfile = 'arCarbine';
export const DEFAULT_HOLDOVER_OUTPUT_UNIT: HoldoverOutputUnit = 'physical';

export type MpbrProfile =
  | '556Nato55'
  | '556Nato77'
  | '308Hunting'
  | '9mmPcc'
  | '22Lr'
  | '12gaSlug'
  | 'genericCarbine'
  | 'genericHuntingRifle'
  | 'custom';

export type MpbrUnitSystem = 'merican' | 'metric';

export interface MpbrProfilePreset {
  muzzleVelocityFps: number;
  dropAt300YardsInches: number;
  defaultSightHeightInches: number;
  defaultVitalZoneInches: number;
}

export interface MpbrCalculationResult {
  recommendedZeroYards: number;
  nearZeroYards: number;
  farZeroYards: number;
  mpbrYards: number;
  maximumRiseInches: number;
  maximumRiseYards: number;
}

export const MPBR_PROFILE_PRESETS: Record<MpbrProfile, MpbrProfilePreset> = {
  '556Nato55': {
    muzzleVelocityFps: 3100,
    dropAt300YardsInches: 26,
    defaultSightHeightInches: 2.5,
    defaultVitalZoneInches: 6,
  },
  '556Nato77': {
    muzzleVelocityFps: 2750,
    dropAt300YardsInches: 32,
    defaultSightHeightInches: 2.5,
    defaultVitalZoneInches: 6,
  },
  '308Hunting': {
    muzzleVelocityFps: 2700,
    dropAt300YardsInches: 29,
    defaultSightHeightInches: 1.5,
    defaultVitalZoneInches: 6,
  },
  '9mmPcc': {
    muzzleVelocityFps: 1300,
    dropAt300YardsInches: 245,
    defaultSightHeightInches: 2,
    defaultVitalZoneInches: 4,
  },
  '22Lr': {
    muzzleVelocityFps: 1200,
    dropAt300YardsInches: 360,
    defaultSightHeightInches: 1.5,
    defaultVitalZoneInches: 4,
  },
  '12gaSlug': {
    muzzleVelocityFps: 1600,
    dropAt300YardsInches: 210,
    defaultSightHeightInches: 1.5,
    defaultVitalZoneInches: 8,
  },
  genericCarbine: {
    muzzleVelocityFps: 2850,
    dropAt300YardsInches: 30,
    defaultSightHeightInches: 2.5,
    defaultVitalZoneInches: 6,
  },
  genericHuntingRifle: {
    muzzleVelocityFps: 2800,
    dropAt300YardsInches: 28,
    defaultSightHeightInches: 1.5,
    defaultVitalZoneInches: 6,
  },
  custom: {
    muzzleVelocityFps: 2600,
    dropAt300YardsInches: 36,
    defaultSightHeightInches: 2,
    defaultVitalZoneInches: 6,
  },
};

export const DEFAULT_MPBR_PROFILE: MpbrProfile = '556Nato55';

export const MPBR_VITAL_ZONE_LIMITS = {
  merican: {
    min: 1,
    max: 24,
  },
  metric: {
    min: 2.5,
    max: 60,
  },
} as const;

export const MPBR_HEIGHT_LIMITS = {
  merican: {
    min: 0.25,
    max: 4,
  },
  metric: {
    min: 0.5,
    max: 10,
  },
} as const;

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

export const getHoldoverProfileHeight = (
  profile: HoldoverFirearmProfile,
  units: 'merican' | 'metric'
): number => {
  const heightInches = HOLDOVER_PROFILE_HEIGHTS_INCHES[profile];
  return units === 'metric'
    ? Math.round(inchesToCentimeters(heightInches) * 100) / 100
    : heightInches;
};

export const getMpbrProfilePreset = (profile: MpbrProfile): MpbrProfilePreset =>
  MPBR_PROFILE_PRESETS[profile] || MPBR_PROFILE_PRESETS[DEFAULT_MPBR_PROFILE];

export const getMpbrProfileVitalZone = (profile: MpbrProfile, units: MpbrUnitSystem): number => {
  const vitalZoneInches = getMpbrProfilePreset(profile).defaultVitalZoneInches;
  return units === 'metric'
    ? Math.round(inchesToCentimeters(vitalZoneInches) * 10) / 10
    : vitalZoneInches;
};

export const getMpbrProfileHeight = (profile: MpbrProfile, units: MpbrUnitSystem): number => {
  const heightInches = getMpbrProfilePreset(profile).defaultSightHeightInches;
  return units === 'metric'
    ? Math.round(inchesToCentimeters(heightInches) * 100) / 100
    : heightInches;
};

const calculateMpbrPathInches = (
  distanceYards: number,
  sightHeightInches: number,
  dropCoefficient: number,
  farZeroYards: number
): number => {
  const launchSlope = (sightHeightInches + dropCoefficient * farZeroYards ** 2) / farZeroYards;
  return -sightHeightInches + launchSlope * distanceYards - dropCoefficient * distanceYards ** 2;
};

export const calculateMpbr = (
  profile: MpbrProfile,
  vitalZoneInches: number,
  sightHeightInches: number
): MpbrCalculationResult => {
  const preset = getMpbrProfilePreset(profile);
  const halfVitalZone = vitalZoneInches / 2;
  const dropCoefficient = preset.dropAt300YardsInches / 300 ** 2;
  const maxSearchYards = profile === '22Lr' || profile === '12gaSlug' ? 260 : 450;

  let low = Math.max(15, sightHeightInches * 12);
  let high = maxSearchYards;

  for (let i = 0; i < 48; i += 1) {
    const farZero = (low + high) / 2;
    const launchSlope = (sightHeightInches + dropCoefficient * farZero ** 2) / farZero;
    const maximumRiseYards = launchSlope / (2 * dropCoefficient);
    const maximumRise = calculateMpbrPathInches(
      maximumRiseYards,
      sightHeightInches,
      dropCoefficient,
      farZero
    );

    if (maximumRise > halfVitalZone) {
      high = farZero;
    } else {
      low = farZero;
    }
  }

  const farZeroYards = (low + high) / 2;
  const launchSlope = (sightHeightInches + dropCoefficient * farZeroYards ** 2) / farZeroYards;
  const maximumRiseYards = launchSlope / (2 * dropCoefficient);
  const maximumRiseInches = calculateMpbrPathInches(
    maximumRiseYards,
    sightHeightInches,
    dropCoefficient,
    farZeroYards
  );

  const zeroDiscriminant = launchSlope ** 2 - 4 * dropCoefficient * sightHeightInches;
  const nearZeroYards =
    zeroDiscriminant > 0
      ? (launchSlope - Math.sqrt(zeroDiscriminant)) / (2 * dropCoefficient)
      : farZeroYards;

  const endpointDiscriminant =
    launchSlope ** 2 - 4 * dropCoefficient * (sightHeightInches - halfVitalZone);
  const mpbrYards = (launchSlope + Math.sqrt(endpointDiscriminant)) / (2 * dropCoefficient);

  return {
    recommendedZeroYards: Math.round(nearZeroYards / 5) * 5,
    nearZeroYards: Math.round(nearZeroYards),
    farZeroYards: Math.round(farZeroYards),
    mpbrYards: Math.round(mpbrYards),
    maximumRiseInches: Math.round(maximumRiseInches * 10) / 10,
    maximumRiseYards: Math.round(maximumRiseYards),
  };
};

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

export const calculateHoldoverOffset = (
  heightOverBore: number,
  targetDistance: number,
  zeroDistance: number
): number => {
  if (zeroDistance === 0) {
    return 0;
  }
  return heightOverBore * (targetDistance / zeroDistance - 1);
};

export const calculateHoldoverMoa = (offsetInches: number, distanceYards: number): number => {
  const inchesPerMoa = (distanceYards * 1.047) / 100;
  if (inchesPerMoa === 0) {
    return 0;
  }
  return offsetInches / inchesPerMoa;
};

export const calculateHoldoverMrad = (offsetInches: number, distanceYards: number): number => {
  const inchesPerMrad = (distanceYards * 3.6) / 100;
  if (inchesPerMrad === 0) {
    return 0;
  }
  return offsetInches / inchesPerMrad;
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
