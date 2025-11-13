/**
 * Campaign Planning Utilities
 *
 * Helper functions for analyzing inventory and generating campaign recommendations
 * for media buying dashboard.
 */

import { createClient } from '@supabase/supabase-js';

export interface MetroInventory {
  dma: string;
  vehicle_count: number;
  dealer_count: number;
  diversity_score: number;
  top_body_styles: { body_style: string; count: number }[];
  avg_price: number;
}

export interface BodyStyleInventory {
  body_style: string;
  vehicle_count: number;
  dealer_count: number;
  top_metros: string[];
  avg_price: number;
}

export interface MakeInventory {
  make: string;
  vehicle_count: number;
  dealer_count: number;
  top_body_styles: string[];
  top_metros: string[];
  avg_price: number;
}

export interface CampaignRecommendation {
  id: string;
  name: string;
  tier: 'tier1' | 'tier2' | 'tier3' | 'avoid';
  metro: string;
  category: 'all' | 'suv' | 'truck' | 'sedan' | string; // body_style or make
  vehicles: number;
  dealers: number;
  diversity: number;
  recommended_daily_budget: number;
  trend: 'growing' | 'stable' | 'declining';
  reason: string;
}

/**
 * Get inventory breakdown by metro/DMA
 */
export async function getMetroInventory(
  supabase: ReturnType<typeof createClient>
): Promise<MetroInventory[]> {
  const { data, error } = await supabase.rpc('get_metro_inventory');

  if (error) {
    console.error('Error fetching metro inventory:', error);
    return [];
  }

  return data || [];
}

/**
 * Get inventory breakdown by body style
 */
export async function getBodyStyleInventory(
  supabase: ReturnType<typeof createClient>
): Promise<BodyStyleInventory[]> {
  const { data, error } = await supabase.rpc('get_body_style_inventory');

  if (error) {
    console.error('Error fetching body style inventory:', error);
    return [];
  }

  return data || [];
}

/**
 * Get inventory breakdown by make
 */
export async function getMakeInventory(
  supabase: ReturnType<typeof createClient>
): Promise<MakeInventory[]> {
  const { data, error } = await supabase.rpc('get_make_inventory');

  if (error) {
    console.error('Error fetching make inventory:', error);
    return [];
  }

  return data || [];
}

/**
 * Generate campaign recommendations based on inventory depth
 */
export function generateCampaignRecommendations(
  metros: MetroInventory[],
  totalMonthlyBudget: number = 7500
): CampaignRecommendation[] {
  const recommendations: CampaignRecommendation[] = [];

  // Calculate total inventory score across all metros
  const totalScore = metros.reduce(
    (sum, metro) => sum + metro.vehicle_count * metro.diversity_score,
    0
  );

  for (const metro of metros) {
    const inventoryScore = metro.vehicle_count * metro.diversity_score;
    const budgetProportion = inventoryScore / totalScore;
    const recommendedDailyBudget = Math.round((totalMonthlyBudget * budgetProportion) / 30);

    // Determine tier
    let tier: CampaignRecommendation['tier'] = 'avoid';
    let reason = '';

    if (metro.vehicle_count >= 500 && metro.dealer_count >= 15 && metro.diversity_score >= 0.80) {
      tier = 'tier1';
      reason = 'High inventory, excellent dealer diversity, stable';
    } else if (metro.vehicle_count >= 200 && metro.dealer_count >= 8 && metro.diversity_score >= 0.70) {
      tier = 'tier2';
      reason = 'Adequate inventory, good diversity';
    } else if (metro.vehicle_count >= 100 && metro.dealer_count >= 5) {
      tier = 'tier3';
      reason = 'Low inventory, test with caution';
    } else {
      reason = 'Insufficient inventory or dealer diversity';
    }

    recommendations.push({
      id: `${metro.dma.toLowerCase().replace(/\s+/g, '_')}_all`,
      name: `${metro.dma} - All Vehicles`,
      tier,
      metro: metro.dma,
      category: 'all',
      vehicles: metro.vehicle_count,
      dealers: metro.dealer_count,
      diversity: metro.diversity_score,
      recommended_daily_budget: recommendedDailyBudget,
      trend: 'stable', // TODO: Calculate from feed_sync_logs
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

  return recommendations;
}

/**
 * Calculate recommended budget allocation across campaigns
 */
export function calculateBudgetAllocation(
  campaigns: CampaignRecommendation[],
  totalMonthlyBudget: number,
  cpcAssumption: number = 0.50,
  conversionRateAssumption: number = 0.35
): {
  allocations: Array<{
    campaign: string;
    monthly_budget: number;
    daily_budget: number;
    expected_clicks: number;
    expected_revenue: number;
    expected_profit: number;
    roi_pct: number;
  }>;
  summary: {
    total_monthly_spend: number;
    total_monthly_revenue: number;
    total_monthly_profit: number;
    overall_roi: number;
  };
} {
  const viableCampaigns = campaigns.filter(c => c.tier !== 'avoid');

  const allocations = viableCampaigns.map(campaign => {
    const monthly_budget = campaign.recommended_daily_budget * 30;
    const daily_budget = campaign.recommended_daily_budget;
    const expected_daily_clicks = daily_budget / cpcAssumption;
    const expected_dealer_clicks = expected_daily_clicks * conversionRateAssumption;
    const expected_daily_revenue = expected_dealer_clicks * 0.80;
    const expected_monthly_revenue = expected_daily_revenue * 30;
    const expected_monthly_profit = expected_monthly_revenue - monthly_budget;
    const roi_pct = (expected_monthly_profit / monthly_budget) * 100;

    return {
      campaign: campaign.name,
      monthly_budget,
      daily_budget,
      expected_clicks: Math.round(expected_daily_clicks * 30),
      expected_revenue: Math.round(expected_monthly_revenue * 100) / 100,
      expected_profit: Math.round(expected_monthly_profit * 100) / 100,
      roi_pct: Math.round(roi_pct),
    };
  });

  const summary = allocations.reduce(
    (sum, alloc) => ({
      total_monthly_spend: sum.total_monthly_spend + alloc.monthly_budget,
      total_monthly_revenue: sum.total_monthly_revenue + alloc.expected_revenue,
      total_monthly_profit: sum.total_monthly_profit + alloc.expected_profit,
      overall_roi: 0, // Calculated below
    }),
    { total_monthly_spend: 0, total_monthly_revenue: 0, total_monthly_profit: 0, overall_roi: 0 }
  );

  summary.overall_roi = Math.round((summary.total_monthly_profit / summary.total_monthly_spend) * 100);

  return { allocations, summary };
}
