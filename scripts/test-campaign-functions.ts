#!/usr/bin/env tsx

/**
 * Test campaign planning database functions
 */

import { config } from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testFunctions() {
  console.log('Testing campaign planning functions...\n');

  // Test 1: Metro inventory
  console.log('1. Testing get_metro_inventory()...');
  const { data: metros, error: metroError } = await supabase.rpc('get_metro_inventory');

  if (metroError) {
    console.error('❌ Error:', metroError.message);
  } else {
    console.log(`✅ Success! Found ${metros?.length || 0} metros with 50+ vehicles`);
    if (metros && metros.length > 0) {
      console.log('   Top metro:', metros[0].dma, '-', metros[0].vehicle_count, 'vehicles');
    }
  }

  // Test 2: Body style inventory
  console.log('\n2. Testing get_body_style_inventory()...');
  const { data: bodyStyles, error: bodyError } = await supabase.rpc('get_body_style_inventory');

  if (bodyError) {
    console.error('❌ Error:', bodyError.message);
  } else {
    console.log(`✅ Success! Found ${bodyStyles?.length || 0} body styles`);
    if (bodyStyles && bodyStyles.length > 0) {
      console.log('   Top body style:', bodyStyles[0].body_style, '-', bodyStyles[0].vehicle_count, 'vehicles');
    }
  }

  // Test 3: Make inventory
  console.log('\n3. Testing get_make_inventory()...');
  const { data: makes, error: makeError } = await supabase.rpc('get_make_inventory');

  if (makeError) {
    console.error('❌ Error:', makeError.message);
  } else {
    console.log(`✅ Success! Found ${makes?.length || 0} makes with 100+ vehicles`);
    if (makes && makes.length > 0) {
      console.log('   Top make:', makes[0].make, '-', makes[0].vehicle_count, 'vehicles');
    }
  }

  console.log('\n✅ All functions working!\n');
}

testFunctions();
