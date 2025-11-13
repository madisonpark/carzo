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
  console.log('Checking rate limiting infrastructure...\n');

  // Check if rate_limits table exists
  const { data: tables, error: tableError } = await supabase
    .from('rate_limits')
    .select('count');

  if (tableError) {
    console.error('❌ rate_limits table does not exist or cannot be accessed');
    console.error('Error:', tableError.message);
    console.log('\nRate limiting will NOT work without this table.');
    console.log('Check: supabase/migrations/20251112000005_create_rate_limiting_tables.sql');
    process.exit(1);
  }

  console.log('✅ rate_limits table exists');

  // Check if check_rate_limit function exists
  const { data, error } = await supabase.rpc('check_rate_limit', {
    p_identifier: 'test-user',
    p_endpoint: 'test',
    p_limit: 10,
    p_window_seconds: 60,
  });

  if (error) {
    console.error('❌ check_rate_limit function does not exist or has errors');
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log('✅ check_rate_limit function exists and returns:', data);
  console.log('\n✅ Rate limiting infrastructure is operational');
}

check();
