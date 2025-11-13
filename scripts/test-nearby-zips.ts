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
  console.log('Testing get_nearby_zips function...\n');

  // Tampa, FL coordinates
  const { data, error } = await supabase.rpc('get_nearby_zips', {
    p_latitude: 27.9476,
    p_longitude: -82.4584,
    p_radius_miles: 25,
  });

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  console.log(`✅ Success! Found ${data?.length || 0} ZIP codes within 25 miles of Tampa`);

  if (data && data.length > 0) {
    console.log('\nSample ZIPs:');
    data.slice(0, 10).forEach((z: any) => {
      console.log(`  ${z.zip_code} - ${z.city}, ${z.state} (${z.distance_miles} mi)`);
    });
  }
}

test();
