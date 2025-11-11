/**
 * Fix column size constraints
 * Run: npx tsx scripts/fix-column-sizes.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';

async function main() {
  console.log('🔧 Fixing column size constraints...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Run ALTER TABLE via SQL
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      ALTER TABLE vehicles
        ALTER COLUMN interior_color TYPE VARCHAR(100),
        ALTER COLUMN exterior_color TYPE VARCHAR(100),
        ALTER COLUMN model TYPE VARCHAR(100),
        ALTER COLUMN transmission TYPE VARCHAR(100),
        ALTER COLUMN fuel_type TYPE VARCHAR(100);
    `
  });

  if (error) {
    console.error('❌ Failed:', error);

    // Try direct approach via SQL editor
    console.log('\n⚠️  Direct SQL approach failed. Please run this SQL in Supabase SQL Editor:\n');
    console.log(`
ALTER TABLE vehicles
  ALTER COLUMN interior_color TYPE VARCHAR(100),
  ALTER COLUMN exterior_color TYPE VARCHAR(100),
  ALTER COLUMN model TYPE VARCHAR(100),
  ALTER COLUMN transmission TYPE VARCHAR(100),
  ALTER COLUMN fuel_type TYPE VARCHAR(100);
    `);
    process.exit(1);
  }

  console.log('✅ Column sizes updated successfully!');
}

main();
