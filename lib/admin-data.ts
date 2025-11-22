import { supabaseAdmin } from '@/lib/supabase';
import { unstable_cache } from 'next/cache';

const MAX_METRO_RESULTS = 10;
const MAX_MAKE_RESULTS = 15;

export interface InventoryCount {
  body_style?: string;
  make?: string;
  metro?: string;
  vehicle_count: number;
}

export interface InventorySnapshot {
  total_vehicles: number;
  total_dealers: number;
  by_metro: Record<string, number>;
  by_body_style: Record<string, number>;
  by_make: Record<string, number>;
  updated_at: string;
}

export interface CombinationsData {
  make_bodystyle: Array<{ combo_name: string; vehicle_count: number }>;
  make_model: Array<{ combo_name: string; vehicle_count: number }>;
}

/**
 * Fetches the inventory snapshot data using the admin Supabase client.
 * This function can be called from API routes or Server Components.
 */
export async function getInventorySnapshot(): Promise<InventorySnapshot> {
  try {
    // Get all three inventory breakdowns
    const [metroResult, bodyStyleResult, makeResult] = await Promise.all([
      supabaseAdmin.rpc('get_metro_inventory'),
      supabaseAdmin.rpc('get_body_style_inventory'),
      supabaseAdmin.rpc('get_make_inventory'),
    ]);

    if (metroResult.error) throw metroResult.error;
    if (bodyStyleResult.error) throw bodyStyleResult.error;
    if (makeResult.error) throw makeResult.error;

    // Calculate totals
    const totalVehicles = (metroResult.data as InventoryCount[] | null)?.reduce(
      (sum: number, m: InventoryCount) => sum + Number(m.vehicle_count),
      0
    ) || 0;

    // Get actual unique dealer count from database
    const { data: dealerCountData, error: dealerError } = await supabaseAdmin.rpc('get_unique_dealer_count');

    if (dealerError) {
      console.error('Error getting dealer count:', dealerError);
    }

    const totalDealers = dealerCountData || 0;

    // Format by_metro as simple object
    const byMetro = Object.fromEntries(
      ((metroResult.data as InventoryCount[] | null) || [])
        .slice(0, MAX_METRO_RESULTS)
        .map((m: InventoryCount) => [m.metro || 'Unknown', Number(m.vehicle_count)])
    );

    // Format by_body_style
    const byBodyStyle = Object.fromEntries(
      ((bodyStyleResult.data as InventoryCount[] | null) || []).map((b: InventoryCount) => [b.body_style || 'Unknown', Number(b.vehicle_count)])
    );

    // Format by_make (top 15)
    const byMake = Object.fromEntries(
      ((makeResult.data as InventoryCount[] | null) || [])
        .slice(0, MAX_MAKE_RESULTS)
        .map((m: InventoryCount) => [m.make || 'Unknown', Number(m.vehicle_count)])
    );

    return {
      total_vehicles: totalVehicles,
      total_dealers: totalDealers,
      by_metro: byMetro,
      by_body_style: byBodyStyle,
      by_make: byMake,
      updated_at: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching inventory snapshot:', error);
    throw error;
  }
}

/**
 * Cached version of getInventorySnapshot.
 * Caches the result for 5 minutes to reduce database load.
 */
export const getCachedInventorySnapshot = unstable_cache(
  getInventorySnapshot,
  ['admin-data', 'inventory-snapshot'],
  { revalidate: 300 } // 5 minutes
);

/**
 * Fetches the combinations data using the admin Supabase client.
 */
export async function getCombinations(): Promise<CombinationsData> {
  try {
    const [makeBodyStyleResult, makeModelResult] = await Promise.all([
      supabaseAdmin.rpc('get_make_bodystyle_combos'),
      supabaseAdmin.rpc('get_make_model_combos'),
    ]);

    if (makeBodyStyleResult.error) throw makeBodyStyleResult.error;
    if (makeModelResult.error) throw makeModelResult.error;

    return {
      make_bodystyle: makeBodyStyleResult.data || [],
      make_model: makeModelResult.data || [],
    };
  } catch (error) {
    console.error('Error fetching combinations:', error);
    throw error;
  }
}

/**
 * Cached version of getCombinations.
 * Caches the result for 5 minutes to reduce database load.
 */
export const getCachedCombinations = unstable_cache(
  getCombinations,
  ['admin-data', 'combinations'],
  { revalidate: 300 } // 5 minutes
);
