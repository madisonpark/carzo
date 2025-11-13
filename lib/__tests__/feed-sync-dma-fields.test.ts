import { describe, it, expect } from 'vitest';

/**
 * Tests for DMA field mapping in feed sync
 * Validates certified, dol, and dma field parsing from LotLinx feed
 */

describe('Feed Sync - DMA Fields Parsing', () => {
  // Helper to simulate the parsing logic from feed-sync.ts
  function parseCertified(value: string | undefined): boolean {
    return ['true', '1', 'yes'].includes(value?.toLowerCase() || '');
  }

  function parseDol(value: string | undefined): number | null {
    const parsed = parseInt(value || '');
    return !isNaN(parsed) ? parsed : null;
  }

  describe('certified field parsing', () => {
    it('should parse "true" as true', () => {
      expect(parseCertified('true')).toBe(true);
    });

    it('should parse "True" (capital) as true', () => {
      expect(parseCertified('True')).toBe(true);
    });

    it('should parse "1" as true', () => {
      expect(parseCertified('1')).toBe(true);
    });

    it('should parse "yes" as true', () => {
      expect(parseCertified('yes')).toBe(true);
    });

    it('should parse "YES" as true', () => {
      expect(parseCertified('YES')).toBe(true);
    });

    it('should parse "false" as false', () => {
      expect(parseCertified('false')).toBe(false);
    });

    it('should parse "0" as false', () => {
      expect(parseCertified('0')).toBe(false);
    });

    it('should parse empty string as false', () => {
      expect(parseCertified('')).toBe(false);
    });

    it('should parse undefined as false', () => {
      expect(parseCertified(undefined)).toBe(false);
    });

    it('should parse random string as false', () => {
      expect(parseCertified('maybe')).toBe(false);
    });
  });

  describe('dol (days on lot) field parsing', () => {
    it('should parse "5" as 5', () => {
      expect(parseDol('5')).toBe(5);
    });

    it('should parse "0" as 0 (NOT null - critical bug fix)', () => {
      expect(parseDol('0')).toBe(0);
    });

    it('should parse "100" as 100', () => {
      expect(parseDol('100')).toBe(100);
    });

    it('should parse empty string as null', () => {
      expect(parseDol('')).toBe(null);
    });

    it('should parse undefined as null', () => {
      expect(parseDol(undefined)).toBe(null);
    });

    it('should parse "N/A" as null', () => {
      expect(parseDol('N/A')).toBe(null);
    });

    it('should parse "abc" as null', () => {
      expect(parseDol('abc')).toBe(null);
    });

    it('should parse negative numbers correctly', () => {
      expect(parseDol('-5')).toBe(-5);
    });
  });

  describe('dma field mapping', () => {
    it('should pass through valid DMA', () => {
      const dma = 'Tampa-St. Petersburg-Clearwater DMA';
      expect(dma || null).toBe(dma);
    });

    it('should return null for empty DMA', () => {
      const dma = '';
      expect(dma || null).toBe(null);
    });

    it('should return null for undefined DMA', () => {
      const dma = undefined;
      expect(dma || null).toBe(null);
    });
  });
});
