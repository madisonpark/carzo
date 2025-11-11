import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function getSampleVin() {
  const { data, error } = await supabase
    .from('vehicles')
    .select('vin, year, make, model, trim, price')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (error || !data) {
    console.error('Error:', error);
    return;
  }

  console.log('\n🚗 Sample Vehicle:');
  console.log(`   VIN: ${data.vin}`);
  console.log(`   ${data.year} ${data.make} ${data.model} ${data.trim || ''}`);
  console.log(`   Price: $${data.price.toLocaleString()}`);
  console.log(`\n🔗 Test URL: http://localhost:3000/vehicles/${data.vin}\n`);
}

getSampleVin();
