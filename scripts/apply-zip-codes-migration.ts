#!/usr/bin/env tsx

/**
 * Apply us_zip_codes migration directly using postgres driver
 * This bypasses CLI connection pool issues
 */

import { config } from 'dotenv';
import { join } from 'path';
import { readFileSync } from 'fs';
import pg from 'pg';

// Load environment variables
config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabasePassword = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Extract connection details from Supabase URL
// Format: https://[project-ref].supabase.co
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');

// Direct database connection (bypasses pooler)
const connectionString = `postgresql://postgres.${projectRef}:${supabasePassword}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`;

async function applyMigration() {
  const client = new pg.Client({ connectionString });

  try {
    console.log('Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected\n');

    // Read migration SQL
    const migrationPath = join(__dirname, '../supabase/migrations/20251113095725_add_us_zip_codes_table.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('Applying migration: 20251113095725_add_us_zip_codes_table.sql');
    await client.query(sql);
    console.log('✅ Migration applied successfully\n');

    // Verify table exists
    const { rows } = await client.query(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'us_zip_codes'
    `);

    if (rows.length > 0) {
      console.log('✅ Table verified: us_zip_codes exists\n');
    }

    // Update migration tracking table
    console.log('Updating migration tracking...');
    await client.query(`
      INSERT INTO supabase_migrations.schema_migrations (version, name, statements)
      VALUES ('20251113095725', 'add_us_zip_codes_table', ARRAY[$1])
      ON CONFLICT (version) DO NOTHING
    `, [sql]);
    console.log('✅ Migration tracking updated\n');

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
