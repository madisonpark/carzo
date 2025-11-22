import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const maxDuration = 60; // 1 minute (cleanup is fast)
export const dynamic = 'force-dynamic';

/**
 * Cron endpoint for rate limit cleanup
 * Vercel Cron: Runs hourly at :00 minutes
 *
 * To test manually:
 * curl http://localhost:3000/api/cron/cleanup-rate-limits \
 *   -H "Authorization: Bearer YOUR_CRON_SECRET"
 */
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Invalid or missing CRON_SECRET' },
      { status: 401 }
    );
  }

  try {
    // Call cleanup function (requires admin privileges)
    const { data, error } = await supabaseAdmin.rpc('cleanup_rate_limits');

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      deletedRecords: data || 0,
      timestamp: new Date().toISOString(),
      message: 'Rate limit cleanup completed successfully',
    });
  } catch (error) {
    console.error('Rate limit cleanup error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Database error',
        message: 'Failed to delete rate limit records',
      },
      { status: 500 }
    );
  }
}
