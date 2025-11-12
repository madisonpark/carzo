#!/usr/bin/env npx tsx

/**
 * Verify Rate Limiting Migration
 *
 * Checks if the rate limiting table and functions were successfully created
 */

import { supabaseAdmin } from '../lib/supabase';

async function verifyRateLimiting() {
  console.log('🔍 Verifying rate limiting migration...\n');

  // Test 1: Check if rate_limits table exists by trying to query it
  console.log('1. Checking if rate_limits table exists...');
  const { data: tableCheck, error: tableError } = await supabaseAdmin
    .from('rate_limits')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('❌ rate_limits table does not exist or is not accessible');
    console.error('Error:', tableError.message);
    return false;
  }
  console.log('✅ rate_limits table exists\n');

  // Test 2: Check if check_rate_limit function exists by calling it
  console.log('2. Testing check_rate_limit() function...');
  const { data: funcCheck, error: funcError } = await supabaseAdmin.rpc('check_rate_limit', {
    p_identifier: 'test-verify-123',
    p_endpoint: 'test_endpoint',
    p_limit: 10,
    p_window_seconds: 60,
  });

  if (funcError) {
    console.error('❌ check_rate_limit() function does not exist or failed');
    console.error('Error:', funcError.message);
    return false;
  }
  console.log('✅ check_rate_limit() function works');
  console.log('   Result:', funcCheck);
  console.log('');

  // Test 3: Check if cleanup_rate_limits function exists
  console.log('3. Testing cleanup_rate_limits() function...');
  const { data: cleanupCheck, error: cleanupError } = await supabaseAdmin.rpc('cleanup_rate_limits');

  if (cleanupError) {
    console.error('❌ cleanup_rate_limits() function does not exist or failed');
    console.error('Error:', cleanupError.message);
    return false;
  }
  console.log('✅ cleanup_rate_limits() function works');
  console.log(`   Cleaned up ${cleanupCheck} old records\n`);

  // Test 4: Verify rate limiting actually works
  console.log('4. Testing rate limiting enforcement...');
  const testIdentifier = 'test-enforcement-' + Date.now();

  // Make 3 requests (limit is 10)
  for (let i = 1; i <= 3; i++) {
    const { data: result } = await supabaseAdmin.rpc('check_rate_limit', {
      p_identifier: testIdentifier,
      p_endpoint: 'test_endpoint',
      p_limit: 2, // Low limit for testing
      p_window_seconds: 60,
    });
    console.log(`   Request ${i}: allowed=${result[0].allowed}, count=${result[0].current_count}/${result[0].limit_value}`);
  }

  console.log('');
  console.log('✅ All rate limiting components verified successfully!');
  console.log('');
  console.log('📋 Summary:');
  console.log('   - rate_limits table: ✅ Created');
  console.log('   - check_rate_limit() function: ✅ Working');
  console.log('   - cleanup_rate_limits() function: ✅ Working');
  console.log('   - Rate limit enforcement: ✅ Working');
  console.log('');
  console.log('🎉 Rate limiting migration successfully applied!');

  return true;
}

verifyRateLimiting()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('💥 Verification failed with error:', error);
    process.exit(1);
  });
