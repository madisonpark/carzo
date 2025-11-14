#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function test() {
  console.log('Testing get_metro_inventory...\n');

  const { data, error } = await supabase.rpc('get_metro_inventory');

  if (error) {
    console.error('❌ Error:', error.message);
    console.error('Details:', error);
    process.exit(1);
  }

  console.log(`✅ Success! Found ${data?.length || 0} metros`);
  if (data && data.length > 0) {
    console.log('\nFirst result:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

test();
