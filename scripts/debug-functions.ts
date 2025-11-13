#!/usr/bin/env tsx

import { config } from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debug() {
  // Test metro function
  const { data: metros, error: metroError } = await supabase.rpc('get_metro_inventory');

  console.log('Metro function:');
  console.log('Error:', metroError);
  console.log('Data sample:', metros?.[0]);
  console.log('\n');

  // Test body style with raw SQL to see actual structure
  const { data: bodyTest, error: bodyError } = await supabase.rpc('get_body_style_inventory');

  console.log('Body style function:');
  console.log('Error:', bodyError);
  console.log('Data:', bodyTest);
}

debug();
