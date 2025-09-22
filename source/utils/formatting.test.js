import {
  formatUptime,
  formatBytes,
  formatDecimalCurrency
} from './formatting.js';

describe('formatting utilities', () => {
  describe('formatUptime', () => {
    test('should format seconds only', () => {
      expect(formatUptime(30)).toBe('30s');
      expect(formatUptime(0)).toBe('0s');
    });

    test('should format minutes and seconds', () => {
      expect(formatUptime(90)).toBe('1m 30s');
      expect(formatUptime(120)).toBe('2m');
    });

    test('should format hours, minutes and seconds', () => {
      expect(formatUptime(3665)).toBe('1h 1m 5s');
      expect(formatUptime(3600)).toBe('1h');
    });

    test('should format days, hours, minutes and seconds', () => {
      expect(formatUptime(90061)).toBe('1d 1h 1m 1s');
      expect(formatUptime(86400)).toBe('1d');
    });

    test('should handle complex combinations', () => {
      expect(formatUptime(93784)).toBe('1d 2h 3m 4s');
      expect(formatUptime(259200)).toBe('3d');
    });

    test('should floor decimal seconds', () => {
      expect(formatUptime(30.9)).toBe('30s');
    });
  });

  describe('formatBytes', () => {
    test('should format bytes', () => {
      expect(formatBytes(0)).toBe('0 B');
      expect(formatBytes(512)).toBe('512.00 B');
      expect(formatBytes(1023)).toBe('1023.00 B');
    });

    test('should format kilobytes', () => {
      expect(formatBytes(1024)).toBe('1.00 KB');
      expect(formatBytes(1536)).toBe('1.50 KB');
    });

    test('should format megabytes', () => {
      expect(formatBytes(1048576)).toBe('1.00 MB');
      expect(formatBytes(1572864)).toBe('1.50 MB');
    });

    test('should format gigabytes', () => {
      expect(formatBytes(1073741824)).toBe('1.00 GB');
      expect(formatBytes(1610612736)).toBe('1.50 GB');
    });

    test('should format terabytes', () => {
      expect(formatBytes(1099511627776)).toBe('1.00 TB');
    });
  });

  describe('formatDecimalCurrency', () => {
    test('should format with default prefix and suffix', () => {
      expect(formatDecimalCurrency(100.5)).toBe('$100.50');
      expect(formatDecimalCurrency(0)).toBe('$0.00');
    });

    test('should format with custom prefix', () => {
      expect(formatDecimalCurrency(100.5, '€')).toBe('€100.50');
      expect(formatDecimalCurrency(100.5, '')).toBe('100.50');
    });

    test('should format with custom suffix', () => {
      expect(formatDecimalCurrency(100.5, '$', 'USD')).toBe('$100.50 USD');
    });

    test('should handle prefix spacing', () => {
      expect(formatDecimalCurrency(100.5, '$', '', true)).toBe('$ 100.50');
    });

    test('should handle suffix spacing', () => {
      expect(formatDecimalCurrency(100.5, '$', 'USD', false, false)).toBe('$100.50USD');
    });

    test('should format with both prefix and suffix spacing', () => {
      expect(formatDecimalCurrency(100.5, '€', 'EUR', true, false)).toBe('€ 100.50EUR');
    });

    test('should round to 2 decimal places', () => {
      expect(formatDecimalCurrency(100.555)).toBe('$100.56');
      expect(formatDecimalCurrency(100.554)).toBe('$100.55');
    });
  });
});