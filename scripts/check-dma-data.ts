#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
  console.log('Checking DMA data population...\n');

  // Check how many vehicles have DMA
  const { count: totalVehicles } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true);

  const { count: vehiclesWithDma } = await supabase
    .from('vehicles')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .not('dma', 'is', null);

  console.log(`Total active vehicles: ${totalVehicles || 0}`);
  console.log(`Vehicles with DMA: ${vehiclesWithDma || 0}`);
  console.log(`Percentage: ${totalVehicles ? Math.round((vehiclesWithDma! / totalVehicles) * 100) : 0}%\n`);

  if (vehiclesWithDma && vehiclesWithDma > 0) {
    // Get sample DMAs
    const { data: sampleDmas } = await supabase
      .from('vehicles')
      .select('dma')
      .eq('is_active', true)
      .not('dma', 'is', null)
      .limit(10);

    console.log('Sample DMAs:');
    sampleDmas?.forEach((v: any, i: number) => {
      console.log(`  ${i + 1}. ${v.dma}`);
    });
  }
}

check();
