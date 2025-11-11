/**
 * Test click tracking with dealer deduplication
 * Run: npx tsx scripts/test-click-tracking.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

async function testClickTracking() {
  console.log('🧪 Testing Click Tracking API\n');

  // Get a real vehicle from database
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: vehicle } = await supabase
    .from('vehicles')
    .select('id, vin, dealer_id')
    .eq('is_active', true)
    .limit(1)
    .single();

  if (!vehicle) {
    console.error('❌ No vehicles found in database');
    return;
  }

  const testUserId = 'test-user-' + Date.now();
  const vehicleId = vehicle.id;
  const dealerId = vehicle.dealer_id;

  console.log(`Test User ID: ${testUserId}`);
  console.log(`Vehicle ID: ${vehicleId}`);
  console.log(`Dealer ID: ${dealerId}\n`);

  // Test 1: First click (should be billable)
  console.log('📍 Test 1: First click to dealer (should be billable)');
  const response1 = await fetch('http://localhost:3000/api/track-click', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vehicleId,
      dealerId,
      userId: testUserId,
      sessionId: 'session-1',
      ctaClicked: 'primary',
    }),
  });

  const result1 = await response1.json();
  console.log('Response:', result1);
  console.log(`✅ First click billable: ${result1.billable}`);

  if (!result1.billable) {
    console.error('❌ ERROR: First click should be billable!');
  }

  console.log('');

  // Test 2: Second click same dealer (should NOT be billable)
  console.log('📍 Test 2: Second click to same dealer (should NOT be billable)');
  const response2 = await fetch('http://localhost:3000/api/track-click', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vehicleId,
      dealerId,
      userId: testUserId,
      sessionId: 'session-1',
      ctaClicked: 'history',
    }),
  });

  const result2 = await response2.json();
  console.log('Response:', result2);
  console.log(`✅ Second click billable: ${result2.billable}`);

  if (result2.billable) {
    console.error('❌ ERROR: Second click to same dealer should NOT be billable!');
  }

  console.log('');

  // Test 3: Click to different dealer (should be billable)
  // Get a different dealer from database
  const { data: vehicle2 } = await supabase
    .from('vehicles')
    .select('dealer_id')
    .eq('is_active', true)
    .neq('dealer_id', dealerId)
    .limit(1)
    .single();

  const dealerId2 = vehicle2?.dealer_id || dealerId + '-different';
  console.log('📍 Test 3: Click to different dealer (should be billable)');
  console.log(`New Dealer ID: ${dealerId2}`);
  const response3 = await fetch('http://localhost:3000/api/track-click', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      vehicleId,
      dealerId: dealerId2,
      userId: testUserId,
      sessionId: 'session-1',
      ctaClicked: 'primary',
    }),
  });

  const result3 = await response3.json();
  console.log('Response:', result3);
  console.log(`✅ Third click billable: ${result3.billable}`);

  if (!result3.billable) {
    console.error('❌ ERROR: Click to different dealer should be billable!');
  }

  console.log('');

  // Summary
  console.log('📊 Test Summary:');
  console.log(`   Test 1 (first click, dealer ${dealerId}): ${result1.billable ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Test 2 (duplicate dealer ${dealerId}): ${!result2.billable ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Test 3 (new dealer ${dealerId2}): ${result3.billable ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = result1.billable && !result2.billable && result3.billable;
  console.log(`\n${allPassed ? '✅ All tests passed!' : '❌ Some tests failed!'}`);
}

testClickTracking().catch(console.error);
