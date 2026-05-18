import {
  calculateClickValueInches,
  calculateZeroClicks,
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
});
