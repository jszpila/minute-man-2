import {
  calculateHoldoverMoa,
  calculateHoldoverMrad,
  calculateHoldoverOffset,
  calculateClickValueInches,
  calculateMpbr,
  calculateZeroClicks,
  getMpbrProfileHeight,
  getMpbrProfileVitalZone,
  getHoldoverProfileHeight,
  MPBR_PROFILE_PRESETS,
  ZERO_DISTANCE_LIMITS,
} from './calculations';

describe('zero calculator calculations', () => {
  it('calculates MOA click value at distance', () => {
    expect(calculateClickValueInches(100, 0.25, 'moa')).toBe(0.25);
  });

  it('calculates MRAD click value at distance', () => {
    expect(calculateClickValueInches(100, 0.1, 'mrad')).toBeCloseTo(0.36);
  });

  it('calculates clicks from offset and click value', () => {
    expect(calculateZeroClicks(1, 0.25)).toBe(4);
  });

  it('defines zero distance limits for imperial and metric units', () => {
    expect(ZERO_DISTANCE_LIMITS.merican.min).toBe(10);
    expect(ZERO_DISTANCE_LIMITS.merican.step).toBe(5);
    expect(ZERO_DISTANCE_LIMITS.metric.min).toBe(9);
    expect(ZERO_DISTANCE_LIMITS.metric.step).toBe(5);
  });

  it('calculates holdover physical offset', () => {
    expect(calculateHoldoverOffset(2.5, 10, 50)).toBe(-2);
  });

  it('calculates holdover angular values', () => {
    expect(calculateHoldoverMoa(2, 100)).toBeCloseTo(1.91);
    expect(calculateHoldoverMrad(3.6, 100)).toBeCloseTo(1);
  });

  it('returns metric holdover profile heights', () => {
    expect(getHoldoverProfileHeight('arCarbine', 'metric')).toBe(6.35);
  });

  it('returns MPBR profile defaults for preset selection', () => {
    expect(MPBR_PROFILE_PRESETS['556Nato55'].defaultSightHeightInches).toBe(2.5);
    expect(getMpbrProfileVitalZone('9mmPcc', 'merican')).toBe(4);
    expect(getMpbrProfileHeight('556Nato55', 'metric')).toBe(6.35);
  });

  it('calculates practical MPBR outputs', () => {
    const result = calculateMpbr('556Nato55', 6, 2.5);

    expect(result.recommendedZeroYards).toBeGreaterThanOrEqual(30);
    expect(result.nearZeroYards).toBeLessThan(result.farZeroYards);
    expect(result.farZeroYards).toBeGreaterThan(180);
    expect(result.mpbrYards).toBeGreaterThan(result.farZeroYards);
    expect(result.maximumRiseInches).toBeCloseTo(3, 0);
  });

  it('returns shorter MPBR for slower profiles', () => {
    const rifle = calculateMpbr('308Hunting', 6, 1.5);
    const slug = calculateMpbr('12gaSlug', 8, 1.5);

    expect(slug.mpbrYards).toBeLessThan(rifle.mpbrYards);
    expect(slug.farZeroYards).toBeLessThan(rifle.farZeroYards);
  });
});
