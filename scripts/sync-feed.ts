/**
 * Feed Sync Script
 * Run manually: npx tsx scripts/sync-feed.ts
 * Run via cron: Called by /app/api/cron/sync-feed/route.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(__dirname, '../.env.local') });

import { FeedSyncService } from '../lib/feed-sync';

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin operations
  const feedUsername = process.env.LOTLINX_FEED_USERNAME;
  const feedPassword = process.env.LOTLINX_FEED_PASSWORD;
  const publisherId = process.env.LOTLINX_PUBLISHER_ID;

  if (!supabaseUrl || !supabaseKey || !feedUsername || !feedPassword || !publisherId) {
    console.error('❌ Missing required environment variables');
    console.error('Required:');
    console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    console.error('  - SUPABASE_SERVICE_ROLE_KEY');
    console.error('  - LOTLINX_FEED_USERNAME');
    console.error('  - LOTLINX_FEED_PASSWORD');
    console.error('  - LOTLINX_PUBLISHER_ID');
    process.exit(1);
  }

  console.log('🚀 Carzo Feed Sync');
  console.log('==================');
  console.log(`Publisher ID: ${publisherId}`);
  console.log(`Supabase: ${supabaseUrl}`);
  console.log('');

  const syncService = new FeedSyncService(
    supabaseUrl,
    supabaseKey,
    feedUsername,
    feedPassword,
    publisherId
  );

  const result = await syncService.syncFeed();

  if (result.success) {
    console.log('');
    console.log('✅ Sync completed successfully!');
    process.exit(0);
  } else {
    console.log('');
    console.error('❌ Sync failed!');
    console.error('Errors:', result.errors);
    process.exit(1);
  }
}

main();
