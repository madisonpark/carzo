/**
 * Quick database connection test
 * Run with: npx tsx test-db.ts
 */

// Load environment variables FIRST
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '.env.local') });

// Import Supabase client directly to avoid module initialization issues
import { createClient } from '@supabase/supabase-js';

async function testConnection() {
  console.log('🔍 Testing Supabase connection...\n');

  // Get environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('Environment check:');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ loaded' : '✗ missing');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ loaded' : '✗ missing');
  console.log('');

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Missing environment variables');
    process.exit(1);
  }

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Test 1: Check connection
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('count')
      .limit(1);

    if (error) throw error;

    console.log('✅ Connection successful!');
    console.log('✅ Vehicles table exists');
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return;
  }

  // Test 2: Check all tables exist
  const tables = ['vehicles', 'clicks', 'dealer_click_history', 'impressions', 'feed_sync_logs'];

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(0);

      if (error) throw error;
      console.log(`✅ Table '${table}' exists`);
    } catch (error) {
      console.error(`❌ Table '${table}' not found`);
    }
  }

  console.log('\n🎉 Database setup complete!');
}

testConnection();
