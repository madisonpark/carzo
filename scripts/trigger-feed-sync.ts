#!/usr/bin/env tsx

/**
 * Manually trigger feed sync (normally runs 4x/day via Vercel Cron)
 */

import { config } from 'dotenv';
import { join } from 'path';

config({ path: join(__dirname, '../.env.local') });

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const cronSecret = process.env.CRON_SECRET;

if (!cronSecret) {
  console.error('❌ CRON_SECRET not found in .env.local');
  process.exit(1);
}

async function triggerSync() {
  console.log('Triggering feed sync...\n');
  console.log('This will take 30-60 seconds...\n');

  const response = await fetch(`${siteUrl}/api/cron/sync-feed`, {
    headers: {
      Authorization: `Bearer ${cronSecret}`,
    },
  });

  if (!response.ok) {
    console.error(`❌ Sync failed with status ${response.status}`);
    const error = await response.text();
    console.error('Error:', error);
    process.exit(1);
  }

  const result = await response.json();

  console.log('✅ Sync completed successfully!\n');
  console.log('Results:');
  console.log(`  Added: ${result.added || 0} vehicles`);
  console.log(`  Updated: ${result.updated || 0} vehicles`);
  console.log(`  Removed: ${result.removed || 0} vehicles`);
  console.log(`  Duration: ${result.duration || 0}ms\n`);
}

triggerSync();
