import { NextRequest, NextResponse } from 'next/server';
import { FeedSyncService } from '@/lib/feed-sync';

/**
 * Cron endpoint for feed synchronization
 * Vercel Cron: Runs 4x daily at 03:00, 09:00, 15:00, 21:00 PST/PDT
 *
 * To test manually:
 * curl http://localhost:3000/api/cron/sync-feed \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function GET(request: NextRequest) {
  // Verify cron secret for security
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET not configured');
    return NextResponse.json(
      { error: 'Cron secret not configured' },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error('Unauthorized cron request');
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    console.log('🚀 Starting scheduled feed sync...');

    // Get environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const feedUsername = process.env.LOTLINX_FEED_USERNAME;
    const feedPassword = process.env.LOTLINX_FEED_PASSWORD;
    const publisherId = process.env.LOTLINX_PUBLISHER_ID;

    if (!supabaseUrl || !supabaseKey || !feedUsername || !feedPassword || !publisherId) {
      throw new Error('Missing required environment variables');
    }

    // Initialize sync service
    const syncService = new FeedSyncService(
      supabaseUrl,
      supabaseKey,
      feedUsername,
      feedPassword,
      publisherId
    );

    // Run sync
    const result = await syncService.syncFeed();

    if (result.success) {
      console.log('✅ Feed sync completed successfully');
      return NextResponse.json({
        success: true,
        result: {
          added: result.added,
          updated: result.updated,
          removed: result.removed,
          duration: result.duration,
        },
      });
    } else {
      console.error('❌ Feed sync failed:', result.errors);
      return NextResponse.json(
        {
          success: false,
          errors: result.errors,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('❌ Cron job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Disable body parsing timeout for long-running sync
export const maxDuration = 300; // 5 minutes (Vercel Pro plan allows up to 5 min)
export const dynamic = 'force-dynamic';
