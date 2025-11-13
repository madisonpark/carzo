#!/usr/bin/env tsx

/**
 * Check actual schema of vehicles table
 */

import { config } from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSchema() {
  console.log('Checking vehicles table schema...\n');

  // Get one vehicle to see all columns
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }

  if (data && data.length > 0) {
    console.log('✅ Columns in vehicles table:');
    console.log(Object.keys(data[0]).sort().join(', '));
    console.log('\n');
  }
}

checkSchema();
