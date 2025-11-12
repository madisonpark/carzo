import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import {
  getClientIdentifier,
  checkMultipleRateLimits,
  RATE_LIMITS,
} from '@/lib/rate-limit';

/**
 * POST /api/filter-options
 *
 * Proxied endpoint for get_filter_options_by_location RPC call
 * Implements rate limiting to prevent DoS and scraping attacks
 *
 * Rate Limits:
 * - 50 requests per minute per IP
 * - 10 requests per second burst limit
 *
 * Body Parameters:
 * - user_lat: number (required)
 * - user_lon: number (required)
 * - make?: string
 * - model?: string
 * - condition?: string
 * - body_style?: string
 * - min_price?: number
 * - max_price?: number
 * - min_year?: number
 * - max_year?: number
 */
export async function POST(request: NextRequest) {
  // Get client identifier (IP or user ID)
  const identifier = getClientIdentifier(request);

  // Check rate limits (both per-minute and burst)
  // Note: This is outside try block to ensure headers are always available
  const rateLimitResult = await checkMultipleRateLimits(identifier, [
    { endpoint: 'filter_options', ...RATE_LIMITS.FILTER_OPTIONS },
    { endpoint: 'filter_options_burst', ...RATE_LIMITS.BURST },
  ]);

  // Add rate limit headers to response
  const headers = {
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': new Date(rateLimitResult.reset).toISOString(),
  };

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message:
          'Too many requests. Please wait a moment before trying again.',
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
      },
      { status: 429, headers }
    );
  }

  try {
    // Parse request body
    const body = await request.json();

    const {
      user_lat,
      user_lon,
      make,
      model,
      condition,
      body_style,
      min_price,
      max_price,
      min_year,
      max_year,
    } = body;

    // Validate required parameters
    if (user_lat === undefined || user_lon === undefined) {
      return NextResponse.json(
        { error: 'Missing required parameters: user_lat and user_lon' },
        { status: 400, headers }
      );
    }

    // Call Supabase RPC function
    const { data, error } = await supabase.rpc(
      'get_filter_options_by_location',
      {
        user_lat,
        user_lon,
        p_make: make || null,
        p_model: model || null,
        p_condition: condition || null,
        p_body_style: body_style || null,
        p_min_price: min_price || null,
        p_max_price: max_price || null,
        p_min_year: min_year || null,
        p_max_year: max_year || null,
      }
    );

    if (error) {
      console.error('Error calling get_filter_options_by_location:', error);
      return NextResponse.json(
        { error: 'Database query failed', details: error.message },
        { status: 500, headers }
      );
    }

    return NextResponse.json(
      { data, success: true },
      { status: 200, headers }
    );
  } catch (error) {
    console.error('Error in filter-options API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow GET requests to return method not allowed
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST.' },
    { status: 405 }
  );
}
