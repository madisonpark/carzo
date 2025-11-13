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

    it('should fetch vehicles with pagination', async () => {
      // Mock first page with 1000 vehicles
      const mockVehicles = Array.from({ length: 1000 }, (_, i) => ({
        vin: `VIN${i}`,
        last_sync: '2025-11-12T06:46:17.149Z',
      }));

      // Mock second page with fewer vehicles (last page)
      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn()
          .mockResolvedValueOnce({ data: mockVehicles, error: null })
          .mockResolvedValueOnce({ data: mockVehicles.slice(0, 500), error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const result = await sitemap();

      // 2 static + 1500 vehicles = 1502
      expect(result).toHaveLength(1502);
      expect(supabase.from).toHaveBeenCalledWith('vehicles');
      expect(mockSupabaseChain.eq).toHaveBeenCalledWith('is_active', true);
      expect(mockSupabaseChain.range).toHaveBeenCalledTimes(2);
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
        range: vi.fn().mockResolvedValue({ data: mockVehicles, error: null }),
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
        expect.stringContaining('Error fetching vehicles page'),
        expect.any(Object)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should respect Google 50K limit (49,998 vehicles + 2 static)', async () => {
      // Mock exactly 50 pages of 1000 vehicles each
      const mockVehiclesPage = Array.from({ length: 1000 }, (_, i) => ({
        vin: `VIN${i}`,
        last_sync: '2025-11-12T06:46:17.149Z',
      }));

      const mockSupabaseChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockVehiclesPage, error: null }),
      };

      vi.mocked(supabase.from).mockReturnValue(mockSupabaseChain as any);

      const result = await sitemap();

      // Should fetch exactly 50 pages (49,998 vehicles + 2 static = 50,000)
      expect(mockSupabaseChain.range).toHaveBeenCalledTimes(50);
      expect(result).toHaveLength(50002);
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
