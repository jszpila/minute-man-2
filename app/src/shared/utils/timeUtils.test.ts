import { formatTimeMMSS } from './timeUtils';

describe('timeUtils', () => {
  describe('formatTimeMMSS', () => {
    it('formats time correctly in MM:SS.CS format', () => {
      expect(formatTimeMMSS(0)).toBe('00:00.00');
      expect(formatTimeMMSS(59000)).toBe('00:59.00');
      expect(formatTimeMMSS(60000)).toBe('01:00.00');
      expect(formatTimeMMSS(125000)).toBe('02:05.00');
      expect(formatTimeMMSS(599000)).toBe('09:59.00');
      expect(formatTimeMMSS(600000)).toBe('10:00.00');
    });

    it('handles milliseconds and centiseconds correctly', () => {
      expect(formatTimeMMSS(1234)).toBe('00:01.23');
      expect(formatTimeMMSS(61234)).toBe('01:01.23');
      expect(formatTimeMMSS(1259)).toBe('00:01.25');
    });

    it('handles large times (multiple minutes)', () => {
      expect(formatTimeMMSS(900000)).toBe('15:00.00'); // 15 minutes
      expect(formatTimeMMSS(3661000)).toBe('61:01.00'); // Over an hour
    });

    it('pads single digit minutes and seconds', () => {
      expect(formatTimeMMSS(0)).toBe('00:00.00');
      expect(formatTimeMMSS(5000)).toBe('00:05.00');
      expect(formatTimeMMSS(60000)).toBe('01:00.00');
    });

    it('pads centiseconds correctly', () => {
      expect(formatTimeMMSS(100)).toBe('00:00.10');
      expect(formatTimeMMSS(10)).toBe('00:00.01');
    });
  });
});
