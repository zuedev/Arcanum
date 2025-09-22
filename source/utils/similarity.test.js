import { calculateSimilarity } from './similarity.js';

describe('similarity utilities', () => {
  describe('calculateSimilarity', () => {
    test('should return 1 for identical strings', () => {
      expect(calculateSimilarity('hello', 'hello')).toBe(1);
      expect(calculateSimilarity('', '')).toBe(1);
    });

    test('should return 0 for completely different strings', () => {
      expect(calculateSimilarity('abc', 'xyz')).toBe(0);
    });

    test('should return 0 when one string is empty', () => {
      expect(calculateSimilarity('', 'hello')).toBe(0);
      expect(calculateSimilarity('hello', '')).toBe(0);
    });

    test('should be case insensitive', () => {
      expect(calculateSimilarity('Hello', 'hello')).toBe(1);
      expect(calculateSimilarity('WORLD', 'world')).toBe(1);
    });

    test('should handle single character differences', () => {
      expect(calculateSimilarity('cat', 'bat')).toBeCloseTo(2/3, 10);
      expect(calculateSimilarity('test', 'best')).toBe(0.75);
    });

    test('should handle insertions', () => {
      expect(calculateSimilarity('cat', 'cats')).toBe(0.75);
    });

    test('should handle deletions', () => {
      expect(calculateSimilarity('cats', 'cat')).toBe(0.75);
    });

    test('should handle substitutions', () => {
      expect(calculateSimilarity('kitten', 'sitting')).toBeCloseTo(0.571, 2);
    });

    test('should convert non-string inputs to strings', () => {
      expect(calculateSimilarity(123, '123')).toBe(1);
      expect(calculateSimilarity(123, 124)).toBeCloseTo(2/3, 2);
    });

    test('should handle longer strings with optimized algorithm', () => {
      const longStr1 = 'a'.repeat(150);
      const longStr2 = 'a'.repeat(149) + 'b';

      expect(calculateSimilarity(longStr1, longStr2)).toBeCloseTo(149/150, 2);
    });

    test('should handle medium length strings', () => {
      const str1 = 'this is a test string for similarity';
      const str2 = 'this is a test string for similarity testing';

      expect(calculateSimilarity(str1, str2)).toBeCloseTo(36/44, 2);
    });

    test('should handle completely different long strings', () => {
      const str1 = 'a'.repeat(150);
      const str2 = 'b'.repeat(150);

      expect(calculateSimilarity(str1, str2)).toBe(0);
    });
  });
});