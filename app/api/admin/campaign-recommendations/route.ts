import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

interface CampaignRecommendation {
  id: string;
  name: string;
  tier: 'tier1' | 'tier2' | 'tier3' | 'avoid';
  metro: string;
  category: string;
  vehicles: number;
  dealers: number;
  diversity: number;
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
    // Get metro inventory
    const { data: metros, error } = await supabase.rpc('get_metro_inventory');

    if (error) {
      throw error;
    }

    const totalMonthlyBudget = 7500; // Default budget
    const recommendations: CampaignRecommendation[] = [];

    // Calculate total inventory score
    const totalScore = metros.reduce(
      (sum: number, metro: any) => sum + metro.vehicle_count * metro.diversity_score,
      0
    );

    // Generate recommendations
    for (const metro of metros) {
      const inventoryScore = metro.vehicle_count * metro.diversity_score;
      const budgetProportion = inventoryScore / totalScore;
      const recommendedDailyBudget = Math.round((totalMonthlyBudget * budgetProportion) / 30);

      // Determine tier
      let tier: CampaignRecommendation['tier'] = 'avoid';
      let reason = '';

      if (
        metro.vehicle_count >= 500 &&
        metro.dealer_count >= 15 &&
        metro.diversity_score >= 0.80
      ) {
        tier = 'tier1';
        reason = 'High inventory, excellent dealer diversity, recommended for immediate launch';
      } else if (
        metro.vehicle_count >= 200 &&
        metro.dealer_count >= 8 &&
        metro.diversity_score >= 0.70
      ) {
        tier = 'tier2';
        reason = 'Adequate inventory, good diversity, launch if budget allows';
      } else if (metro.vehicle_count >= 100 && metro.dealer_count >= 5) {
        tier = 'tier3';
        reason = 'Low inventory, test with caution and small budget';
      } else {
        reason = 'Insufficient inventory or dealer diversity';
      }

      recommendations.push({
        id: `${metro.metro.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_all`,
        name: `${metro.metro} - All Vehicles`,
        tier,
        metro: metro.metro,
        category: 'all',
        vehicles: Number(metro.vehicle_count),
        dealers: Number(metro.dealer_count),
        diversity: Number(metro.diversity_score),
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
