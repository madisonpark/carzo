import { describe, it, expect, beforeAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

/**
 * Integration tests for get_zips_for_metro() PostGIS function
 *
 * These tests require:
 * - Supabase running locally: `supabase start`
 * - Migrations applied: `supabase db push`
 * - ZIP codes imported: `npx tsx scripts/import-all-zip-codes.ts`
 * - Sample vehicle data in database
 *
 * Run these tests with: npm test -- get_zips_for_metro.integration
 */

describe('get_zips_for_metro() PostGIS function - Integration Tests', () => {
  let supabase: ReturnType<typeof createClient>;

  beforeAll(() => {
    // Connect to local Supabase instance
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not set. Run: supabase start');
    }

    supabase = createClient(supabaseUrl, supabaseKey);
  });

  describe('Function Overloading (Backward Compatibility)', () => {
    it('should support old 3-parameter signature', async () => {
      // Call old signature (city, state, radius)
      const { data, error } = await supabase.rpc('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 25,
      });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });

    it('should support new 5-parameter signature', async () => {
      // Call new signature with inventory filters
      const { data, error } = await supabase.rpc('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 25,
        p_make: 'Toyota',
        p_body_style: null,
      });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe('Inventory Filtering', () => {
    it('should filter by make only', async () => {
      // Get ZIPs near dealers with Toyota inventory
      const { data: toyotaZips, error: toyotaError } = await supabase.rpc('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 25,
        p_make: 'Toyota',
        p_body_style: null,
      });

      expect(toyotaError).toBeNull();
      expect(Array.isArray(toyotaZips)).toBe(true);

      // Get ZIPs near ALL dealers (no filter)
      const { data: allZips, error: allError } = await supabase.rpc('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 25,
        p_make: null,
        p_body_style: null,
      });

      expect(allError).toBeNull();
      expect(Array.isArray(allZips)).toBe(true);

      // Filtered results should be subset of unfiltered (or equal if all dealers have Toyota)
      if (toyotaZips && allZips) {
        expect(toyotaZips.length).toBeLessThanOrEqual(allZips.length);
      }
    });

    it('should filter by body_style only', async () => {
      // Get ZIPs near dealers with SUV inventory
      const { data: suvZips, error: suvError } = await supabase.rpc('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 25,
        p_make: null,
        p_body_style: 'suv',
      });

      expect(suvError).toBeNull();
      expect(Array.isArray(suvZips)).toBe(true);

      // Get ZIPs near ALL dealers (no filter)
      const { data: allZips, error: allError } = await supabase.rpc('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 25,
        p_make: null,
        p_body_style: null,
      });

      expect(allError).toBeNull();
      expect(Array.isArray(allZips)).toBe(true);

      // Filtered results should be subset of unfiltered
      if (suvZips && allZips) {
        expect(suvZips.length).toBeLessThanOrEqual(allZips.length);
      }
    });

    it('should filter by both make AND body_style', async () => {
      // Get ZIPs near dealers with Toyota SUVs specifically
      const { data: toyotaSuvZips, error: toyotaSuvError } = await supabase.rpc('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 25,
        p_make: 'Toyota',
        p_body_style: 'suv',
      });

      expect(toyotaSuvError).toBeNull();
      expect(Array.isArray(toyotaSuvZips)).toBe(true);

      // Get ZIPs near dealers with ANY Toyota
      const { data: toyotaZips, error: toyotaError } = await supabase.rpc('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 25,
        p_make: 'Toyota',
        p_body_style: null,
      });

      expect(toyotaError).toBeNull();

      // Combined filter should be subset of single filter
      if (toyotaSuvZips && toyotaZips) {
        expect(toyotaSuvZips.length).toBeLessThanOrEqual(toyotaZips.length);
      }
    });

    it('should return empty array for metro with no matching inventory', async () => {
      // Try to get ZIPs for make that likely doesn't exist in Tampa
      const { data, error } = await supabase.rpc('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 25,
        p_make: 'NonExistentMake123',
        p_body_style: null,
      });

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });
  });

  describe('PostGIS Spatial Queries', () => {
    it('should return fewer ZIPs with smaller radius', async () => {
      // Small radius (10 miles)
      const { data: smallRadius, error: smallError } = await supabase.rpc('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 10,
        p_make: null,
        p_body_style: null,
      });

      expect(smallError).toBeNull();
      expect(Array.isArray(smallRadius)).toBe(true);

      // Large radius (30 miles)
      const { data: largeRadius, error: largeError } = await supabase.rpc('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 30,
        p_make: null,
        p_body_style: null,
      });

      expect(largeError).toBeNull();
      expect(Array.isArray(largeRadius)).toBe(true);

      // Larger radius should include more ZIPs
      if (smallRadius && largeRadius) {
        expect(smallRadius.length).toBeLessThan(largeRadius.length);
      }
    });

    it('should only return distinct ZIP codes', async () => {
      const { data, error } = await supabase.rpc('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 25,
        p_make: null,
        p_body_style: null,
      });

      expect(error).toBeNull();

      if (data && data.length > 0) {
        const zipCodes = data.map((row) => row.zip_code);
        const uniqueZipCodes = new Set(zipCodes);

        // No duplicates
        expect(zipCodes.length).toBe(uniqueZipCodes.size);
      }
    });

    it('should handle metros with no dealers gracefully', async () => {
      // Non-existent city/state combination
      const { data, error } = await supabase.rpc('get_zips_for_metro', {
        p_city: 'NonExistentCity',
        p_state: 'XX',
        p_radius_miles: 25,
        p_make: null,
        p_body_style: null,
      });

      expect(error).toBeNull();
      expect(data).toEqual([]);
    });

    it('should handle NULL latitude/longitude values', async () => {
      // Function should filter out dealers with NULL coordinates
      const { data, error } = await supabase.rpc('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 25,
        p_make: null,
        p_body_style: null,
      });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      // Should not throw error even if some dealers have NULL coordinates
      // Result should only include ZIPs near dealers WITH valid coordinates
    });
  });

  describe('Performance', () => {
    it('should complete within 500ms for typical metro', async () => {
      const startTime = Date.now();

      const { data, error } = await supabase.rpc('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 25,
        p_make: null,
        p_body_style: null,
      });

      const duration = Date.now() - startTime;

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
      expect(duration).toBeLessThan(500); // PostGIS with GIST index should be fast
    });

    it('should use spatial index (GIST) efficiently', async () => {
      // Multiple calls should be consistently fast (index is being used)
      const durations: number[] = [];

      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();

        await supabase.rpc('get_zips_for_metro', {
          p_city: 'Tampa',
          p_state: 'FL',
          p_radius_miles: 25,
          p_make: null,
          p_body_style: null,
        });

        durations.push(Date.now() - startTime);
      }

      // All calls should be fast (not degrading)
      durations.forEach((duration) => {
        expect(duration).toBeLessThan(500);
      });
    });
  });

  describe('Data Format', () => {
    it('should return array of objects with zip_code property', async () => {
      const { data, error } = await supabase.rpc('get_zips_for_metro', {
        p_city: 'Tampa',
        p_state: 'FL',
        p_radius_miles: 25,
        p_make: null,
        p_body_style: null,
      });

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);

      if (data && data.length > 0) {
        const firstZip = data[0];

        expect(firstZip).toHaveProperty('zip_code');
        expect(typeof firstZip.zip_code).toBe('string');
        expect(firstZip.zip_code).toMatch(/^\d{5}$/); // 5-digit ZIP code
      }
    });
  });
});
