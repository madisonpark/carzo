import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

/**
 * Get high-level inventory snapshot
 * Quick reference numbers for ad copy writing
 *
 * @returns Total counts by metro, body style, and make
 */
export async function GET(request: NextRequest) {
  // Simple password auth
  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
    const totalVehicles = metroResult.data?.reduce(
      (sum: number, m: any) => sum + Number(m.vehicle_count),
      0
    ) || 0;

    const totalDealers = new Set(
      metroResult.data?.map((m: any) => m.dealer_count) || []
    ).size;

    // Format by_metro as simple object
    const byMetro = Object.fromEntries(
      (metroResult.data || []).slice(0, 10).map((m: any) => [m.metro, Number(m.vehicle_count)])
    );

    // Format by_body_style
    const byBodyStyle = Object.fromEntries(
      (bodyStyleResult.data || []).map((b: any) => [b.body_style, Number(b.vehicle_count)])
    );

    // Format by_make (top 15)
    const byMake = Object.fromEntries(
      (makeResult.data || []).slice(0, 15).map((m: any) => [m.make, Number(m.vehicle_count)])
    );

    return NextResponse.json({
      total_vehicles: totalVehicles,
      total_dealers: totalDealers,
      by_metro: byMetro,
      by_body_style: byBodyStyle,
      by_make: byMake,
      updated_at: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching inventory snapshot:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory snapshot', details: error.message },
      { status: 500 }
    );
  }
}
