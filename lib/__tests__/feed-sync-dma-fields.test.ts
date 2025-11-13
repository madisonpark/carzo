import { describe, it, expect } from 'vitest';
import { FeedSyncService } from '../feed-sync';

/**
 * Tests for DMA field mapping in feed sync
 * Tests the ACTUAL production parsing functions (not simulations)
 */

describe('FeedSyncService - DMA Fields Parsing', () => {
  describe('parseCertified (production function)', () => {
    it('should parse "true" as true', () => {
      expect(FeedSyncService.parseCertified('true')).toBe(true);
    });

    it('should parse "True" (capital) as true', () => {
      expect(FeedSyncService.parseCertified('True')).toBe(true);
    });

    it('should parse "1" as true', () => {
      expect(FeedSyncService.parseCertified('1')).toBe(true);
    });

    it('should parse "yes" as true', () => {
      expect(FeedSyncService.parseCertified('yes')).toBe(true);
    });

    it('should parse "YES" as true', () => {
      expect(FeedSyncService.parseCertified('YES')).toBe(true);
    });

    it('should parse "false" as false', () => {
      expect(FeedSyncService.parseCertified('false')).toBe(false);
    });

    it('should parse "0" as false', () => {
      expect(FeedSyncService.parseCertified('0')).toBe(false);
    });

    it('should parse empty string as false', () => {
      expect(FeedSyncService.parseCertified('')).toBe(false);
    });

    it('should parse undefined as false', () => {
      expect(FeedSyncService.parseCertified(undefined)).toBe(false);
    });

    it('should parse random string as false', () => {
      expect(FeedSyncService.parseCertified('maybe')).toBe(false);
    });
  });

  describe('parseDol (production function)', () => {
    it('should parse "5" as 5', () => {
      expect(FeedSyncService.parseDol('5')).toBe(5);
    });

    it('should parse "0" as 0 (NOT null - critical bug fix)', () => {
      expect(FeedSyncService.parseDol('0')).toBe(0);
    });

    it('should parse "100" as 100', () => {
      expect(FeedSyncService.parseDol('100')).toBe(100);
    });

    it('should parse empty string as null', () => {
      expect(FeedSyncService.parseDol('')).toBe(null);
    });

    it('should parse undefined as null', () => {
      expect(FeedSyncService.parseDol(undefined)).toBe(null);
    });

    it('should parse "N/A" as null', () => {
      expect(FeedSyncService.parseDol('N/A')).toBe(null);
    });

    it('should parse "abc" as null', () => {
      expect(FeedSyncService.parseDol('abc')).toBe(null);
    });

    it('should reject negative numbers as invalid (returns null)', () => {
      // Days on lot cannot be negative - parseDol validates this at parse time
      expect(FeedSyncService.parseDol('-5')).toBe(null);
      expect(FeedSyncService.parseDol('-100')).toBe(null);
    });
  });
});
