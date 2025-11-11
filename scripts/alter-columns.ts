/**
 * Alter column sizes using Supabase SQL
 * Run: npx tsx scripts/alter-columns.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

async function main() {
  console.log('🔧 Altering column sizes...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const sql = `
ALTER TABLE vehicles
  ALTER COLUMN interior_color TYPE VARCHAR(100),
  ALTER COLUMN exterior_color TYPE VARCHAR(100),
  ALTER COLUMN model TYPE VARCHAR(100),
  ALTER COLUMN transmission TYPE VARCHAR(100),
  ALTER COLUMN fuel_type TYPE VARCHAR(100);
  `.trim();

  console.log('Running SQL:', sql, '\n');

  // Use Supabase PostgREST SQL endpoint
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ sql })
  });

  if (!response.ok) {
    console.error('❌ Failed:', await response.text());
    console.log('\n📋 Please run this SQL manually in Supabase Dashboard → SQL Editor:');
    console.log(sql);
    process.exit(1);
  }

  console.log('✅ Columns altered successfully!');
}

main();
