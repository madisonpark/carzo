import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminAuth } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

interface CampaignRecommendation {
  id: string;
  name: string;
  tier: 'tier1' | 'tier2' | 'tier3' | 'avoid';
  metro: string;
  category: string;
  vehicles: number;
  dealers: number;
  dealer_concentration: number;
  recommended_daily_budget: number;
  trend: 'stable';
  reason: string;
}

/**
 * Generate campaign recommendations based on current inventory
 *
 * @returns JSON with tier-based campaign recommendations
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
    // Get metro inventory
    const { data: metros, error } = await supabase.rpc('get_metro_inventory');

    if (error) {
      throw error;
    }

    const totalMonthlyBudget = 7500; // Default budget
    const recommendations: CampaignRecommendation[] = [];

    // Calculate total inventory score (weight by dealer count for better distribution)
    const totalScore = metros.reduce(
      (sum: number, metro: any) => sum + metro.vehicle_count * metro.dealer_count,
      0
    );

    // Generate recommendations
    for (const metro of metros) {
      const inventoryScore = metro.vehicle_count * metro.dealer_count;
      const budgetProportion = inventoryScore / totalScore;
      const recommendedDailyBudget = Math.round((totalMonthlyBudget * budgetProportion) / 30);

      // Determine tier based on vehicle count and dealer count
      let tier: CampaignRecommendation['tier'] = 'avoid';
      let reason = '';

      if (metro.vehicle_count >= 500 && metro.dealer_count >= 15) {
        tier = 'tier1';
        reason = 'High inventory, many dealers, recommended for immediate launch';
      } else if (metro.vehicle_count >= 200 && metro.dealer_count >= 8) {
        tier = 'tier2';
        reason = 'Adequate inventory, sufficient dealers, launch if budget allows';
      } else if (metro.vehicle_count >= 100 && metro.dealer_count >= 5) {
        tier = 'tier3';
        reason = 'Low inventory, test with caution and small budget';
      } else {
        reason = 'Insufficient inventory or dealer count';
      }

      recommendations.push({
        id: `${metro.metro.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_all`,
        name: `${metro.metro} - All Vehicles`,
        tier,
        metro: metro.metro,
        category: 'all',
        vehicles: Number(metro.vehicle_count),
        dealers: Number(metro.dealer_count),
        dealer_concentration: Number(metro.dealer_concentration),
        recommended_daily_budget: recommendedDailyBudget,
        trend: 'stable',
        reason,
      });
    }

    // Sort by tier, then by vehicle count
    const tierOrder = { tier1: 1, tier2: 2, tier3: 3, avoid: 4 };
    recommendations.sort((a, b) => {
      if (tierOrder[a.tier] !== tierOrder[b.tier]) {
        return tierOrder[a.tier] - tierOrder[b.tier];
      }
      return b.vehicles - a.vehicles;
    });

    // Group by tier
    const tier1 = recommendations.filter(r => r.tier === 'tier1');
    const tier2 = recommendations.filter(r => r.tier === 'tier2');
    const tier3 = recommendations.filter(r => r.tier === 'tier3');

    return NextResponse.json({
      tier1,
      tier2,
      tier3,
      total_campaigns: recommendations.length,
      total_inventory: metros.reduce((sum: number, m: any) => sum + Number(m.vehicle_count), 0),
    });
  } catch (error: any) {
    console.error('Error generating recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to generate campaign recommendations', details: error.message },
      { status: 500 }
    );
  }
}
