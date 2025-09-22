import {
  CONFIG,
  DICE_TYPES,
  CURRENCY_TYPES,
  CURRENCY_ABBREVIATIONS,
  CURRENCY_TO_GOLD_CONVERSION,
  DEFAULT_CONVERSION_FEE,
  ERROR_MESSAGES
} from './constants.js';

describe('constants', () => {
  describe('CONFIG', () => {
    test('should have expected numeric values', () => {
      expect(CONFIG.MAX_DICE_QUANTITY).toBe(100);
      expect(CONFIG.MAX_DICE_SIDES).toBe(100);
      expect(CONFIG.MAX_ITEM_NAME_LENGTH).toBe(100);
      expect(CONFIG.MIN_SEARCH_TERM_LENGTH).toBe(2);
      expect(CONFIG.SIMILARITY_THRESHOLD).toBe(0.5);
      expect(CONFIG.DISCORD_MESSAGE_LIMIT).toBe(2000);
      expect(CONFIG.TRACKER_MESSAGE_LIMIT).toBe(1900);
      expect(CONFIG.CHUNK_SIZE_CALCULATION_THRESHOLD).toBe(100000);
    });

    test('should have collection names object', () => {
      expect(CONFIG.COLLECTION_NAMES).toEqual({
        TRACKERS: "trackers",
        TRACKER_AUDIT_LOG: "tracker_audit_log",
        BANK: "bank",
        BANK_AUDIT_LOG: "bank_audit_log",
        BANK_SETTINGS: "bank_settings",
      });
    });
  });

  describe('DICE_TYPES', () => {
    test('should contain expected dice types', () => {
      expect(DICE_TYPES).toEqual([4, 6, 8, 10, 12, 20, 100]);
    });

    test('should be an array of numbers', () => {
      DICE_TYPES.forEach(type => {
        expect(typeof type).toBe('number');
      });
    });
  });

  describe('CURRENCY_TYPES', () => {
    test('should contain expected currency types', () => {
      expect(CURRENCY_TYPES).toEqual(["platinum", "gold", "silver", "electrum", "copper"]);
    });

    test('should be an array of strings', () => {
      CURRENCY_TYPES.forEach(type => {
        expect(typeof type).toBe('string');
      });
    });
  });

  describe('CURRENCY_ABBREVIATIONS', () => {
    test('should have abbreviations for all currency types', () => {
      CURRENCY_TYPES.forEach(currency => {
        expect(CURRENCY_ABBREVIATIONS[currency]).toBeDefined();
        expect(typeof CURRENCY_ABBREVIATIONS[currency]).toBe('string');
      });
    });

    test('should have expected abbreviations', () => {
      expect(CURRENCY_ABBREVIATIONS.platinum).toBe('pp');
      expect(CURRENCY_ABBREVIATIONS.gold).toBe('gp');
      expect(CURRENCY_ABBREVIATIONS.silver).toBe('sp');
      expect(CURRENCY_ABBREVIATIONS.electrum).toBe('ep');
      expect(CURRENCY_ABBREVIATIONS.copper).toBe('cp');
    });
  });

  describe('CURRENCY_TO_GOLD_CONVERSION', () => {
    test('should have conversion rates for all currency types', () => {
      CURRENCY_TYPES.forEach(currency => {
        expect(CURRENCY_TO_GOLD_CONVERSION[currency]).toBeDefined();
        expect(typeof CURRENCY_TO_GOLD_CONVERSION[currency]).toBe('number');
      });
    });

    test('should have expected conversion rates', () => {
      expect(CURRENCY_TO_GOLD_CONVERSION.platinum).toBe(10);
      expect(CURRENCY_TO_GOLD_CONVERSION.gold).toBe(1);
      expect(CURRENCY_TO_GOLD_CONVERSION.electrum).toBe(0.5);
      expect(CURRENCY_TO_GOLD_CONVERSION.silver).toBe(0.1);
      expect(CURRENCY_TO_GOLD_CONVERSION.copper).toBe(0.01);
    });
  });

  describe('DEFAULT_CONVERSION_FEE', () => {
    test('should be a number', () => {
      expect(typeof DEFAULT_CONVERSION_FEE).toBe('number');
    });

    test('should be 10% (0.1)', () => {
      expect(DEFAULT_CONVERSION_FEE).toBe(0.1);
    });
  });

  describe('ERROR_MESSAGES', () => {
    test('should have all expected error message keys', () => {
      const expectedKeys = [
        'INVALID_QUANTITY',
        'ITEM_NAME_TOO_LONG',
        'ITEM_NOT_FOUND',
        'TRACKER_EMPTY',
        'SEARCH_TERM_TOO_SHORT',
        'NO_PERMISSION',
        'MAX_DICE_EXCEEDED',
        'MAX_SIDES_EXCEEDED',
        'INVALID_CURRENCY',
        'BANK_EMPTY',
        'INVALID_FEE_RATE',
        'SAME_CURRENCY_CONVERSION',
        'INSUFFICIENT_CONVERSION_BALANCE',
        'GENERIC_ERROR',
        'DATABASE_ERROR'
      ];

      expectedKeys.forEach(key => {
        expect(ERROR_MESSAGES[key]).toBeDefined();
        expect(typeof ERROR_MESSAGES[key]).toBe('string');
      });
    });

    test('should have non-empty error messages', () => {
      Object.values(ERROR_MESSAGES).forEach(message => {
        expect(message.length).toBeGreaterThan(0);
      });
    });
  });
});