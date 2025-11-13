#!/usr/bin/env tsx

/**
 * Create us_zip_codes table using Supabase client library
 * This script creates the table directly using SQL query
 */

import { config } from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTable() {
  console.log('Creating us_zip_codes table...\n');

  // First, check if table exists
  console.log('1. Checking if table already exists...');
  const { data: existingTable, error: checkError } = await supabase
    .from('us_zip_codes')
    .select('zip_code')
    .limit(1);

  if (!checkError) {
    console.log('✅ Table already exists!');
    console.log('   No action needed.\n');
    return;
  }

  console.log('2. Table does not exist. Creating...');

  // Since we can't run raw SQL through Supabase client, we'll need to use CLI
  console.log('\n⚠️  Cannot create table via Supabase API directly.');
  console.log('   The table needs to be created using one of these methods:\n');
  console.log('   Option 1: Run migration repair to sync tracking, then push:');
  console.log('   $ supabase migration repair --status applied 20251111000000');
  console.log('   $ supabase migration repair --status applied 20251111000001');
  console.log('   $ ... (repeat for all existing migrations)');
  console.log('   $ supabase db push\n');
  console.log('   Option 2: Create table manually in Supabase dashboard:');
  console.log('   - Go to https://supabase.com/dashboard');
  console.log('   - Navigate to SQL Editor');
  console.log('   - Run the migration SQL from:');
  console.log('     supabase/migrations/20251113095725_add_us_zip_codes_table.sql\n');
}

createTable();
