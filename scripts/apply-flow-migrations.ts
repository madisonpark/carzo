#!/usr/bin/env tsx

/**
 * Apply Flow Column Migrations via Supabase API
 *
 * This script adds the 'flow' column to clicks and impressions tables
 * for A/B test tracking.
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables!');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const SQL_FILE = path.join(process.cwd(), 'apply_flow_columns.sql');

async function applyMigrations() {
  console.log('🔄 Applying flow column migrations...\n');

  try {
    // Read the SQL file
    const sql = fs.readFileSync(SQL_FILE, 'utf-8');

    console.log('📄 Loaded SQL from:', SQL_FILE);
    console.log('📊 SQL size:', sql.length, 'bytes\n');

    // Execute the SQL via RPC
    // Note: This requires a database function to execute raw SQL
    // Since Supabase doesn't expose raw SQL execution directly,
    // we'll need to use the REST API directly

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      // If exec_sql function doesn't exist, provide instructions
      if (error.message.includes('function') || error.code === '42883') {
        console.log('⚠️  Supabase RPC method not available\n');
        console.log('📋 Please apply migrations manually:\n');
        console.log('1. Go to: https://supabase.com/dashboard');
        console.log('2. Select project: Carzo (bjduvewfpounusjqkbjx)');
        console.log('3. Navigate to: SQL Editor → New query');
        console.log('4. Copy contents of: apply_flow_columns.sql');
        console.log('5. Click "Run"\n');
        console.log('Or use psql:');
        console.log(`   psql "${SUPABASE_URL.replace('https://', 'postgresql://postgres:[YOUR_PASSWORD]@').replace('.supabase.co', '.supabase.co:5432/postgres')}" -f apply_flow_columns.sql\n`);
        process.exit(1);
      }

      throw error;
    }

    console.log('✅ Migrations applied successfully!\n');
    console.log('Result:', data);

    // Verify the columns were added
    await verifyMigrations();

  } catch (err) {
    console.error('❌ Error applying migrations:', err);
    process.exit(1);
  }
}

async function verifyMigrations() {
  console.log('\n🔍 Verifying migrations...\n');

  try {
    // Check clicks table
    const { data: clicksData, error: clicksError } = await supabase
      .from('clicks')
      .select('flow')
      .limit(1);

    if (clicksError) {
      console.error('❌ Error verifying clicks table:', clicksError);
    } else {
      console.log('✅ clicks.flow column exists');
    }

    // Check impressions table
    const { data: impressionsData, error: impressionsError } = await supabase
      .from('impressions')
      .select('flow')
      .limit(1);

    if (impressionsError) {
      console.error('❌ Error verifying impressions table:', impressionsError);
    } else {
      console.log('✅ impressions.flow column exists');
    }

    console.log('\n✨ Migration verification complete!');

  } catch (err) {
    console.error('⚠️  Error during verification:', err);
  }
}

// Run migrations
applyMigrations();
