import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminAuth } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * Get high-level inventory snapshot
 * Quick reference numbers for ad copy writing
 *
 * @returns Total counts by metro, body style, and make
 */
interface InventoryCount {
  body_style?: string;
  make?: string;
  metro?: string;
  vehicle_count: number;
}

export async function GET(request: NextRequest) {
  // Validate auth and rate limiting
  const authResult = await validateAdminAuth(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get all three inventory breakdowns
    const [metroResult, bodyStyleResult, makeResult] = await Promise.all([
      supabase.rpc('get_metro_inventory'),
      supabase.rpc('get_body_style_inventory'),
      supabase.rpc('get_make_inventory'),
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
    const { data: dealerCountData, error: dealerError } = await supabase.rpc('get_unique_dealer_count');

    if (dealerError) {
      console.error('Error getting dealer count:', dealerError);
    }

    const totalDealers = dealerCountData || 0;

    // Format by_metro as simple object
    const byMetro = Object.fromEntries(
      ((metroResult.data as InventoryCount[] | null) || []).slice(0, 10).map((m: InventoryCount) => [m.metro, Number(m.vehicle_count)])
    );

    // Format by_body_style
    const byBodyStyle = Object.fromEntries(
      ((bodyStyleResult.data as InventoryCount[] | null) || []).map((b: InventoryCount) => [b.body_style, Number(b.vehicle_count)])
    );

    // Format by_make (top 15)
    const byMake = Object.fromEntries(
      ((makeResult.data as InventoryCount[] | null) || []).slice(0, 15).map((m: InventoryCount) => [m.make, Number(m.vehicle_count)])
    );

    return NextResponse.json({
      total_vehicles: totalVehicles,
      total_dealers: totalDealers,
      by_metro: byMetro,
      by_body_style: byBodyStyle,
      by_make: byMake,
      updated_at: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Error fetching inventory snapshot:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch inventory snapshot', details: errorMessage },
      { status: 500 }
    );
  }
}
