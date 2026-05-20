import { formatBuildDate, getDiagnosticsVersionInfo } from './buildInfo';

jest.mock('../static/GitInfo', () => ({
  __esModule: true,
  default: {
    sha: 'abc123def456',
    date: '2026-05-19',
  },
}));

describe('buildInfo', () => {
  describe('formatBuildDate', () => {
    it('formats ISO git dates for diagnostics display', () => {
      expect(formatBuildDate('2026-05-19')).toBe('05/19/26');
    });

    it('returns non-ISO dates unchanged', () => {
      expect(formatBuildDate('dev')).toBe('dev');
      expect(formatBuildDate('unknown')).toBe('unknown');
    });
  });

  describe('getDiagnosticsVersionInfo', () => {
    it('includes app version, git sha, and formatted git date', () => {
      expect(getDiagnosticsVersionInfo()).toBe('v0.0.0-test (abc123def456, 05/19/26)');
    });
  });
});
