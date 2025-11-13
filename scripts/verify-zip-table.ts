#!/usr/bin/env tsx

/**
 * Verify us_zip_codes table was created successfully
 */

import { config } from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function verify() {
  console.log('Verifying us_zip_codes table...\n');

  const { data, error } = await supabase
    .from('us_zip_codes')
    .select('count');

  if (error) {
    console.error('❌ Table does not exist or cannot be accessed');
    console.error('Error:', error.message);
    process.exit(1);
  }

  console.log('✅ Table exists and is accessible!');
  console.log(`Current row count: ${data?.[0]?.count || 0}\n`);
}

verify();
