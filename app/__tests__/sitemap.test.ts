import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import sitemap from '../sitemap';
import { supabase } from '@/lib/supabase';

// Mock Supabase client
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

describe('sitemap.ts', () => {
  const originalEnv = process.env.NEXT_PUBLIC_SITE_URL;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = originalEnv;
    vi.clearAllMocks();
  });

  describe('Staging environment (stage.carzo.net)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://stage.carzo.net';
    });

    it('should return empty sitemap for staging', async () => {
      const result = await sitemap();

      expect(result).toEqual([]);
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('Production environment (carzo.net)', () => {
    beforeEach(() => {
      process.env.NEXT_PUBLIC_SITE_URL = 'https://carzo.net';
    });

    it('should include static pages (homepage and search)', async () => {
      // Mock empty vehicle result
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const result = await sitemap();

      expect(result).toHaveLength(2);
      expect(result[0].url).toBe('https://carzo.net');
      expect(result[0].priority).toBe(1.0);
      expect(result[0].changeFrequency).toBe('daily');

      expect(result[1].url).toBe('https://carzo.net/search');
      expect(result[1].priority).toBe(0.8);
      expect(result[1].changeFrequency).toBe('daily');
    });

    it('should fetch vehicles with pagination in parallel', async () => {
      // Mock first page with 1000 unique vehicles
      const mockVehiclesPage1 = Array.from({ length: 1000 }, (_, i) => ({
        vin: `VIN_PAGE1_${i}`,
        last_sync: '2025-11-12T06:46:17.149Z',
      }));

      // Mock second page with fewer unique vehicles (last page)
      const mockVehiclesPage2 = Array.from({ length: 500 }, (_, i) => ({
        vin: `VIN_PAGE2_${i}`,
        last_sync: '2025-11-12T06:46:17.149Z',
      }));

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        const currentCall = callCount++;
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue(
            currentCall === 0
              ? { data: mockVehiclesPage1, error: null }
              : currentCall === 1
              ? { data: mockVehiclesPage2, error: null }
              : { data: [], error: null }
          ),
        } as any;
      });

      const result = await sitemap();

      // 2 static + 1500 unique vehicles = 1502
      expect(result).toHaveLength(1502);
      expect(supabase.from).toHaveBeenCalledWith('vehicles');
    });

    it('should include vehicle URLs with correct format', async () => {
      const mockVehicles = [
        { vin: 'ABC123', last_sync: '2025-11-12T06:46:17.149Z' },
        { vin: 'DEF456', last_sync: null },
      ];

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn()
          .mockResolvedValueOnce({ data: mockVehicles, error: null })
          .mockResolvedValue({ data: [], error: null }), // All other pages return empty
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const result = await sitemap();

      const vehicleUrls = result.filter(url => url.url.includes('/vehicles/'));
      expect(vehicleUrls).toHaveLength(2);
      expect(vehicleUrls[0].url).toBe('https://carzo.net/vehicles/ABC123');
      expect(vehicleUrls[0].priority).toBe(0.7);
      expect(vehicleUrls[0].changeFrequency).toBe('weekly');

      // Check lastModified handling (null should use current date)
      expect(vehicleUrls[0].lastModified).toBeInstanceOf(Date);
      expect(vehicleUrls[1].lastModified).toBeInstanceOf(Date);
    });

    it('should handle Supabase errors gracefully', async () => {
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      const result = await sitemap();

      // Should still return static pages
      expect(result).toHaveLength(2);
      expect(result[0].url).toBe('https://carzo.net');
      expect(result[1].url).toBe('https://carzo.net/search');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error fetching vehicle page:',
        expect.objectContaining({ message: 'Database error' })
      );

      consoleErrorSpy.mockRestore();
    });

    it('should deduplicate vehicles if database returns duplicates', async () => {
      const duplicateVehicles = [
        { vin: 'ABC123', last_sync: '2025-11-12T06:46:17.149Z' },
        { vin: 'DEF456', last_sync: '2025-11-11T06:46:17.149Z' },
        { vin: 'ABC123', last_sync: '2025-11-10T06:46:17.149Z' }, // Duplicate (older)
      ];

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        const currentCall = callCount++;
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue(
            currentCall === 0
              ? { data: duplicateVehicles, error: null }
              : { data: [], error: null }
          ),
        } as any;
      });

      const result = await sitemap();

      const vehicleUrls = result.filter(url => url.url.includes('/vehicles/'));
      // Should have 2 unique vehicles (ABC123 and DEF456), not 3
      expect(vehicleUrls).toHaveLength(2);
      // Should keep the most recently synced version of ABC123
      const abc123 = vehicleUrls.find(url => url.url.includes('ABC123'));
      expect(abc123?.lastModified?.toISOString()).toContain('2025-11-12');
    });

    it('should handle VINs with special characters (URL encoding)', async () => {
      const vehiclesWithSpecialChars = [
        { vin: 'ABC-123_XYZ', last_sync: '2025-11-12T06:46:17.149Z' },
        { vin: '1HGCM82633A123456', last_sync: '2025-11-12T06:46:17.149Z' }, // Normal VIN
      ];

      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        const currentCall = callCount++;
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue(
            currentCall === 0
              ? { data: vehiclesWithSpecialChars, error: null }
              : { data: [], error: null }
          ),
        } as any;
      });

      const result = await sitemap();

      const vehicleUrls = result.filter(url => url.url.includes('/vehicles/'));
      expect(vehicleUrls).toHaveLength(2);
      // VINs are URL-encoded (encodeURIComponent), though hyphens/underscores are not affected
      expect(vehicleUrls[0].url).toBe('https://carzo.net/vehicles/ABC-123_XYZ');
      expect(vehicleUrls[1].url).toBe('https://carzo.net/vehicles/1HGCM82633A123456');
    });

    it('should respect Google 50K limit (49,998 vehicles + 2 static = 50,000)', async () => {
      // Mock each page with unique VINs to avoid deduplication
      let callCount = 0;
      vi.mocked(supabase.from).mockImplementation(() => {
        const currentCall = callCount++;
        const pageOffset = currentCall * 1000;
        const mockVehiclesPage = Array.from({ length: 1000 }, (_, i) => ({
          vin: `VIN_${pageOffset + i}`,
          last_sync: '2025-11-12T06:46:17.149Z',
        }));

        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: mockVehiclesPage, error: null }),
        } as any;
      });

      const result = await sitemap();

      // Should fetch exactly 50 pages and slice to 49,998 vehicles + 2 static = 50,000 total
      expect(supabase.from).toHaveBeenCalledTimes(50);
      expect(result).toHaveLength(50000);
    });
  });

  describe('Default environment (no NEXT_PUBLIC_SITE_URL)', () => {
    beforeEach(() => {
      delete process.env.NEXT_PUBLIC_SITE_URL;
    });

    it('should default to carzo.net', async () => {
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const result = await sitemap();

      expect(result[0].url).toBe('https://carzo.net');
      expect(result[1].url).toBe('https://carzo.net/search');
    });
  });
});
