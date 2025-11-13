import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminAuth } from '@/lib/admin-auth';
import type { MetroInventoryRow, BudgetAllocation, BudgetSummary } from '@/lib/types/campaign-planning';

export const dynamic = 'force-dynamic';

/**
 * Calculate budget allocation and ROI projections
 *
 * Query params:
 * - total_budget: Monthly budget (default: 7500)
 * - cpc: Assumed CPC (default: 0.50)
 * - conversion_rate: Assumed conversion rate (default: 0.35)
 *
 * @returns Budget allocation recommendations with ROI projections
 */
export async function GET(request: NextRequest) {
  // Validate auth and rate limiting
  const authResult = await validateAdminAuth(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  const { searchParams } = new URL(request.url);

  // Parse and validate input parameters
  const totalBudget = Math.max(0, Number(searchParams.get('total_budget') || 7500));
  const cpcAssumption = Math.max(0.01, Number(searchParams.get('cpc') || 0.50));
  const conversionRate = Math.max(0, Math.min(1, Number(searchParams.get('conversion_rate') || 0.35)));

  // Validate all parameters are valid numbers
  if (isNaN(totalBudget) || isNaN(cpcAssumption) || isNaN(conversionRate)) {
    return NextResponse.json(
      { error: 'Invalid numeric parameters. Provide total_budget, cpc, and conversion_rate as numbers.' },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get metro inventory directly (no internal API call)
    const { data: metros, error: metroError } = await supabase.rpc('get_metro_inventory');

    if (metroError) {
      throw metroError;
    }

    // Filter to viable campaigns (tier1 and tier2)
    const viableCampaigns = (metros || []).filter((metro: MetroInventoryRow) => {
      return (
        (metro.vehicle_count >= 500 && metro.dealer_count >= 15) || // tier1
        (metro.vehicle_count >= 200 && metro.dealer_count >= 8) // tier2
      );
    });

    // Handle edge case: no viable campaigns
    if (viableCampaigns.length === 0) {
      return NextResponse.json({
        assumptions: {
          total_monthly_budget: totalBudget,
          cpc: cpcAssumption,
          conversion_rate: conversionRate,
          revenue_per_billable_click: 0.80,
        },
        allocations: [],
        summary: {
          total_monthly_spend: 0,
          total_monthly_revenue: 0,
          total_monthly_profit: 0,
          overall_roi: 0,
        },
        note: 'No metros meet tier 1 or tier 2 criteria (500+ vehicles with 15+ dealers, or 200+ vehicles with 8+ dealers)',
      });
    }

    // Calculate total score for budget allocation
    const totalScore = viableCampaigns.reduce(
      (sum: number, metro: MetroInventoryRow) => sum + Number(metro.vehicle_count) * Number(metro.dealer_count),
      0
    );

    // Calculate allocations
    const allocations: BudgetAllocation[] = viableCampaigns.map((metro: MetroInventoryRow) => {
      const inventoryScore = Number(metro.vehicle_count) * Number(metro.dealer_count);
      const budgetProportion = inventoryScore / totalScore;
      const monthlyBudget = totalBudget * budgetProportion;
      const dailyBudget = monthlyBudget / 30;
      const dailyClicks = dailyBudget / cpcAssumption;
      const dealerClicks = dailyClicks * conversionRate;
      const dailyRevenue = dealerClicks * 0.80;
      const monthlyRevenue = dailyRevenue * 30;
      const monthlyProfit = monthlyRevenue - monthlyBudget;
      const roiPct = (monthlyProfit / monthlyBudget) * 100;

      return {
        campaign: `${metro.metro} - All Vehicles`,
        metro: metro.metro,
        monthly_budget: Math.round(monthlyBudget * 100) / 100,
        daily_budget: Math.round(dailyBudget * 100) / 100,
        expected_clicks: Math.round(dailyClicks * 30),
        expected_revenue: Math.round(monthlyRevenue * 100) / 100,
        expected_profit: Math.round(monthlyProfit * 100) / 100,
        roi_pct: Math.round(roiPct),
      };
    });

    // Calculate summary
    const summary: BudgetSummary = allocations.reduce(
      (sum: BudgetSummary, alloc: BudgetAllocation) => ({
        total_monthly_spend: sum.total_monthly_spend + alloc.monthly_budget,
        total_monthly_revenue: sum.total_monthly_revenue + alloc.expected_revenue,
        total_monthly_profit: sum.total_monthly_profit + alloc.expected_profit,
        overall_roi: 0,
      }),
      { total_monthly_spend: 0, total_monthly_revenue: 0, total_monthly_profit: 0, overall_roi: 0 }
    );

    summary.overall_roi = Math.round((summary.total_monthly_profit / summary.total_monthly_spend) * 100);

    return NextResponse.json({
      assumptions: {
        total_monthly_budget: totalBudget,
        cpc: cpcAssumption,
        conversion_rate: conversionRate,
        revenue_per_billable_click: 0.80,
      },
      allocations,
      summary,
    });
  } catch (error: any) {
    console.error('Error calculating budget:', error);
    return NextResponse.json(
      { error: 'Failed to calculate budget', details: error.message },
      { status: 500 }
    );
  }
}
