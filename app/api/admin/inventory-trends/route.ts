import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminAuth } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * Get 7-day inventory trends by metro
 * Shows which metros are growing/stable/declining
 *
 * @returns Trend analysis for inventory stability
 */
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
    // For MVP, we'll just return current inventory
    // TODO: Implement actual 7-day trend analysis using feed_sync_logs table
    const { data: metros, error } = await supabase.rpc('get_metro_inventory');

    if (error) throw error;

    // Format trends (placeholder - will be real data after DMA added)
    const trends = (metros || []).slice(0, 20).map((metro: any) => ({
      metro: metro.metro,
      vehicle_count_today: Number(metro.vehicle_count),
      vehicle_count_7d_ago: Number(metro.vehicle_count), // TODO: Get from logs
      change_pct: 0, // TODO: Calculate actual change
      status: 'stable' as const,
      daily_burn_rate: 0, // TODO: Calculate
    }));

    return NextResponse.json({
      metros: trends,
      note: 'Full 7-day trend analysis will be available after feed_sync_logs implementation',
    });
  } catch (error: any) {
    console.error('Error fetching inventory trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory trends', details: error.message },
      { status: 500 }
    );
  }
}
