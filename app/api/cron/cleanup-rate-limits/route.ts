import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

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
    // Call cleanup function
    const { data, error } = await supabase.rpc('cleanup_rate_limits');

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
