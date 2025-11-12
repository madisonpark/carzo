import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyTracking() {
  console.log('='.repeat(80));
  console.log('DATABASE VERIFICATION REPORT');
  console.log('='.repeat(80));
  console.log('');

  // 1. Check recent clicks
  console.log('📊 RECENT CLICKS (Last 10)');
  console.log('-'.repeat(80));
  const { data: recentClicks, error: clicksError } = await supabase
    .from('clicks')
    .select('id, vehicle_id, dealer_id, is_billable, cta_clicked, flow, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (clicksError) {
    console.error('Error fetching clicks:', clicksError);
  } else if (recentClicks && recentClicks.length > 0) {
    recentClicks.forEach((click, i) => {
      console.log(`${i + 1}. Flow: ${click.flow || 'NULL'} | CTA: ${click.cta_clicked} | Billable: ${click.is_billable ? 'YES' : 'NO'} | Time: ${click.created_at}`);
    });
  } else {
    console.log('❌ No clicks found in database');
  }
  console.log('');

  // 2. Check recent impressions
  console.log('📊 RECENT IMPRESSIONS (Last 10)');
  console.log('-'.repeat(80));
  const { data: recentImpressions, error: impressionsError } = await supabase
    .from('impressions')
    .select('id, vehicle_id, page_type, flow, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  if (impressionsError) {
    console.error('Error fetching impressions:', impressionsError);
  } else if (recentImpressions && recentImpressions.length > 0) {
    recentImpressions.forEach((imp, i) => {
      console.log(`${i + 1}. Flow: ${imp.flow || 'NULL'} | Page: ${imp.page_type} | Time: ${imp.created_at}`);
    });
  } else {
    console.log('❌ No impressions found in database');
  }
  console.log('');

  // 3. Summary stats by flow (clicks)
  console.log('📊 CLICKS SUMMARY BY FLOW');
  console.log('-'.repeat(80));
  const { data: clickStats, error: clickStatsError } = await supabase
    .from('clicks')
    .select('flow, is_billable');

  if (clickStatsError) {
    console.error('Error fetching click stats:', clickStatsError);
  } else if (clickStats) {
    const stats: Record<string, { total: number; billable: number }> = {};
    clickStats.forEach((click) => {
      const flow = click.flow || 'NULL';
      if (!stats[flow]) {
        stats[flow] = { total: 0, billable: 0 };
      }
      stats[flow].total++;
      if (click.is_billable) {
        stats[flow].billable++;
      }
    });

    Object.entries(stats).forEach(([flow, data]) => {
      console.log(`${flow.padEnd(15)} | Total: ${data.total.toString().padStart(4)} | Billable: ${data.billable.toString().padStart(4)} (${((data.billable / data.total) * 100).toFixed(1)}%)`);
    });
  }
  console.log('');

  // 4. Summary stats by flow (impressions)
  console.log('📊 IMPRESSIONS SUMMARY BY FLOW & PAGE TYPE');
  console.log('-'.repeat(80));
  const { data: impressionStats, error: impressionStatsError } = await supabase
    .from('impressions')
    .select('flow, page_type');

  if (impressionStatsError) {
    console.error('Error fetching impression stats:', impressionStatsError);
  } else if (impressionStats) {
    const stats: Record<string, Record<string, number>> = {};
    impressionStats.forEach((imp) => {
      const flow = imp.flow || 'NULL';
      const pageType = imp.page_type || 'NULL';
      if (!stats[flow]) {
        stats[flow] = {};
      }
      if (!stats[flow][pageType]) {
        stats[flow][pageType] = 0;
      }
      stats[flow][pageType]++;
    });

    Object.entries(stats).forEach(([flow, pages]) => {
      Object.entries(pages).forEach(([pageType, count]) => {
        console.log(`${flow.padEnd(15)} | ${pageType.padEnd(10)} | Count: ${count}`);
      });
    });
  }
  console.log('');

  // 5. Verification results
  console.log('='.repeat(80));
  console.log('VERIFICATION RESULTS');
  console.log('='.repeat(80));

  const hasClicks = recentClicks && recentClicks.length > 0;
  const hasImpressions = recentImpressions && recentImpressions.length > 0;
  const hasFlowData = recentClicks?.some((c) => c.flow !== null);

  console.log(`✅ Clicks table accessible: ${!clicksError ? 'YES' : 'NO'}`);
  console.log(`✅ Impressions table accessible: ${!impressionsError ? 'YES' : 'NO'}`);
  console.log(`✅ Recent clicks found: ${hasClicks ? 'YES' : 'NO'}`);
  console.log(`✅ Recent impressions found: ${hasImpressions ? 'YES' : 'NO'}`);
  console.log(`✅ Flow column populated: ${hasFlowData ? 'YES' : 'NO'}`);
  console.log('');

  if (hasFlowData) {
    const flowTypes = new Set(recentClicks?.map((c) => c.flow).filter(Boolean));
    console.log(`📊 Flow types detected: ${Array.from(flowTypes).join(', ')}`);
  } else {
    console.log('⚠️  WARNING: No flow data found. May need to generate test traffic.');
  }

  console.log('');
  console.log('='.repeat(80));
}

verifyTracking().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
