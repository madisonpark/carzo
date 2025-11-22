import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getInventorySnapshot, getCombinations, getCachedInventorySnapshot, getCachedCombinations } from '../admin-data';
import { supabaseAdmin } from '@/lib/supabase';

// Mock the supabase module
vi.mock('@/lib/supabase', () => ({
  supabaseAdmin: {
    rpc: vi.fn(),
  },
}));

describe('lib/admin-data', () => {
  const mockRpc = supabaseAdmin.rpc as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getInventorySnapshot', () => {
    it('should return formatted inventory snapshot on success', async () => {
      // Setup mocks for the multiple RPC calls
      mockRpc.mockImplementation((funcName) => {
        switch (funcName) {
          case 'get_metro_inventory':
            return Promise.resolve({
              data: [{ metro: 'Tampa', vehicle_count: 100 }],
              error: null
            });
          case 'get_body_style_inventory':
            return Promise.resolve({
              data: [{ body_style: 'suv', vehicle_count: 60 }],
              error: null
            });
          case 'get_make_inventory':
            return Promise.resolve({
              data: [{ make: 'Toyota', vehicle_count: 40 }],
              error: null
            });
          case 'get_unique_dealer_count':
            return Promise.resolve({
              data: 5,
              error: null
            });
          default:
            return Promise.resolve({ data: [], error: null });
        }
      });

      const result = await getInventorySnapshot();

      expect(result.total_vehicles).toBe(100);
      expect(result.total_dealers).toBe(5);
      expect(result.by_metro).toEqual({ 'Tampa': 100 });
      expect(result.by_body_style).toEqual({ 'suv': 60 });
      expect(result.by_make).toEqual({ 'Toyota': 40 });
      expect(mockRpc).toHaveBeenCalledTimes(4);
    });

    it('should handle unknown values with defaults', async () => {
      mockRpc.mockImplementation((funcName) => {
        if (funcName === 'get_metro_inventory') {
          return Promise.resolve({
            // Missing metro name should default to 'Unknown'
            data: [{ metro: null, vehicle_count: 50 }],
            error: null
          });
        }
        return Promise.resolve({ data: [], error: null });
      });

      const result = await getInventorySnapshot();
      expect(result.by_metro).toEqual({ 'Unknown': 50 });
    });

    it('should throw error if any critical RPC call fails', async () => {
      mockRpc.mockImplementation((funcName) => {
        if (funcName === 'get_metro_inventory') {
          return Promise.resolve({
            data: null,
            error: { message: 'Database connection failed' }
          });
        }
        return Promise.resolve({ data: [], error: null });
      });

      await expect(getInventorySnapshot()).rejects.toEqual({ message: 'Database connection failed' });
    });

    it('should handle dealer count error gracefully (log but return 0)', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      mockRpc.mockImplementation((funcName) => {
        if (funcName === 'get_unique_dealer_count') {
          return Promise.resolve({
            data: null,
            error: { message: 'Dealer count failed' }
          });
        }
        return Promise.resolve({ data: [], error: null });
      });

      const result = await getInventorySnapshot();
      
      expect(result.total_dealers).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith('Error getting dealer count:', { message: 'Dealer count failed' });
      
      consoleSpy.mockRestore();
    });
  });

  describe('getCombinations', () => {
    it('should return formatted combinations on success', async () => {
      mockRpc.mockImplementation((funcName) => {
        if (funcName === 'get_make_bodystyle_combos') {
          return Promise.resolve({
            data: [{ combo_name: 'Ford SUV', vehicle_count: 20 }],
            error: null
          });
        }
        if (funcName === 'get_make_model_combos') {
          return Promise.resolve({
            data: [{ combo_name: 'Ford F-150', vehicle_count: 15 }],
            error: null
          });
        }
        return Promise.resolve({ data: [], error: null });
      });

      const result = await getCombinations();

      expect(result.make_bodystyle).toEqual([{ combo_name: 'Ford SUV', vehicle_count: 20 }]);
      expect(result.make_model).toEqual([{ combo_name: 'Ford F-150', vehicle_count: 15 }]);
    });

    it('should throw error if RPC call fails', async () => {
      mockRpc.mockImplementation((funcName) => {
        if (funcName === 'get_make_bodystyle_combos') {
          return Promise.resolve({
            data: null,
            error: { message: 'Combos failed' }
          });
        }
        return Promise.resolve({ data: [], error: null });
      });

      await expect(getCombinations()).rejects.toEqual({ message: 'Combos failed' });
    });
  });

  describe('Caching Configuration', () => {
    it('should export cached version of inventory snapshot', () => {
      expect(getCachedInventorySnapshot).toBeDefined();
      // Note: unstable_cache returns a function, but specific properties depend on Next.js internal implementation.
      // We check it's a function and assume Next.js handles the wrapping correctly as this is a unit test of our module structure.
      expect(typeof getCachedInventorySnapshot).toBe('function');
    });

    it('should export cached version of combinations', () => {
      expect(getCachedCombinations).toBeDefined();
      expect(typeof getCachedCombinations).toBe('function');
    });
  });
});
