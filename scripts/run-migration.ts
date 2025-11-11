/**
 * Run SQL migration directly
 * Run: npx tsx scripts/run-migration.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

async function main() {
  console.log('🔧 Running database migration...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const sql = readFileSync(
    resolve(__dirname, '../supabase/migrations/20251111000001_fix_column_sizes.sql'),
    'utf-8'
  );

  console.log('Running SQL:\n', sql);

  // Use raw SQL query
  const { data, error } = await supabase.rpc('query', { query_text: sql });

  if (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:');
    console.log(sql);
    process.exit(1);
  }

  console.log('✅ Migration completed successfully!');
}

main();
