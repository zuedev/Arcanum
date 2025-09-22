import {
  validateEnvironment,
  validateAndSanitizeString,
  validateCurrency,
  validateFeeRate,
  validateNumber
} from './validation.js';

describe('validation utilities', () => {
  describe('validateEnvironment', () => {
    let originalEnv;

    beforeEach(() => {
      originalEnv = process.env;
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    test('should pass with valid environment variables', () => {
      process.env.DISCORD_BOT_TOKEN = 'test-token';
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.net/testdb';

      expect(() => validateEnvironment()).not.toThrow();
    });

    test('should throw error when DISCORD_BOT_TOKEN is missing', () => {
      delete process.env.DISCORD_BOT_TOKEN;
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.net/testdb';

      expect(() => validateEnvironment()).toThrow('Environment variable DISCORD_BOT_TOKEN is required!');
    });

    test('should throw error when MONGODB_URI is missing', () => {
      process.env.DISCORD_BOT_TOKEN = 'test-token';
      delete process.env.MONGODB_URI;

      expect(() => validateEnvironment()).toThrow('Environment variable MONGODB_URI is required!');
    });

    test('should throw error when MONGODB_URI lacks database name', () => {
      process.env.DISCORD_BOT_TOKEN = 'test-token';
      process.env.MONGODB_URI = 'mongodb+srv://user:pass@cluster.net/';

      expect(() => validateEnvironment()).toThrow('MONGODB_URI must contain a database name!');
    });
  });

  describe('validateAndSanitizeString', () => {
    test('should return trimmed string for valid input', () => {
      expect(validateAndSanitizeString('  hello  ')).toBe('hello');
    });

    test('should throw error for non-string input', () => {
      expect(() => validateAndSanitizeString(123)).toThrow('Input must be a string');
    });

    test('should throw error for empty string after trim', () => {
      expect(() => validateAndSanitizeString('   ')).toThrow('Input cannot be empty');
    });

    test('should throw error for string exceeding max length', () => {
      const longString = 'a'.repeat(101);
      expect(() => validateAndSanitizeString(longString, 100)).toThrow('Input must be 100 characters or less');
    });

    test('should accept string exactly at max length', () => {
      const exactString = 'a'.repeat(50);
      expect(validateAndSanitizeString(exactString, 50)).toBe(exactString);
    });
  });

  describe('validateCurrency', () => {
    test('should return normalized currency for valid input', () => {
      expect(validateCurrency('PLATINUM')).toBe('platinum');
      expect(validateCurrency('  gold  ')).toBe('gold');
    });

    test('should throw error for non-string input', () => {
      expect(() => validateCurrency(123)).toThrow('Currency must be a string');
    });

    test('should throw error for invalid currency', () => {
      expect(() => validateCurrency('INVALID')).toThrow('Invalid currency type');
    });
  });

  describe('validateFeeRate', () => {
    test('should return valid fee rate', () => {
      expect(validateFeeRate(0.5)).toBe(0.5);
      expect(validateFeeRate(0)).toBe(0);
      expect(validateFeeRate(1)).toBe(1);
    });

    test('should throw error for non-number input', () => {
      expect(() => validateFeeRate('0.5')).toThrow('Fee rate must be a number between 0 and 1');
    });

    test('should throw error for negative fee rate', () => {
      expect(() => validateFeeRate(-0.1)).toThrow('Fee rate must be a number between 0 and 1');
    });

    test('should throw error for fee rate greater than 1', () => {
      expect(() => validateFeeRate(1.1)).toThrow('Fee rate must be a number between 0 and 1');
    });

    test('should throw error for NaN', () => {
      expect(() => validateFeeRate(NaN)).toThrow('Fee rate must be a number between 0 and 1');
    });
  });

  describe('validateNumber', () => {
    test('should return valid number within range', () => {
      expect(validateNumber(5)).toBe(5);
      expect(validateNumber(1)).toBe(1);
    });

    test('should throw error for number below minimum', () => {
      expect(() => validateNumber(0, 1, 10)).toThrow('Value must be an integer between 1 and 10');
    });

    test('should throw error for number above maximum', () => {
      expect(() => validateNumber(11, 1, 10)).toThrow('Value must be an integer between 1 and 10');
    });

    test('should throw error for non-integer', () => {
      expect(() => validateNumber(1.5)).toThrow('Value must be an integer between 1 and');
    });

    test('should accept custom min/max values', () => {
      expect(validateNumber(50, 0, 100)).toBe(50);
    });
  });
});