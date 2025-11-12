import { supabaseAdmin } from './supabase';

/**
 * Rate Limiting with PostgreSQL
 *
 * Uses PostgreSQL unlogged tables for fast, ephemeral rate limit counters
 * - No external Redis service needed (uses Supabase database)
 * - Unlogged tables are ~3x faster for writes (skip WAL)
 * - Advisory locks prevent race conditions
 * - Automatic cleanup of old records
 *
 * Trade-off: Counter data lost on crash, but acceptable for rate limiting
 */

/**
 * Rate limit configurations for different endpoints
 */
export const RATE_LIMITS = {
  // Search vehicle endpoint: 100 requests per minute
  SEARCH_VEHICLES: { limit: 100, windowSeconds: 60 },

  // Filter options endpoint: 50 requests per minute
  FILTER_OPTIONS: { limit: 50, windowSeconds: 60 },

  // Burst protection: 10 requests per second
  BURST: { limit: 10, windowSeconds: 1 },

  // Session limit: 500 requests per hour
  SESSION: { limit: 500, windowSeconds: 3600 },
};

/**
 * Helper function to get client identifier
 * Prioritizes IP address, falls back to user ID from cookie
 */
export function getClientIdentifier(request: Request): string {
  // Try to get IP from headers (Vercel provides x-forwarded-for)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Return first IP in the list (client IP)
    return forwardedFor.split(',')[0].trim();
  }

  // Try x-real-ip header
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to user cookie if no IP available
  const cookies = request.headers.get('cookie');
  if (cookies) {
    const userIdMatch = cookies.match(/carzo_user_id=([^;]+)/);
    if (userIdMatch) {
      return `user:${userIdMatch[1]}`;
    }
  }

  // Last resort: use a static identifier (not ideal, but prevents crashes)
  return 'anonymous';
}

/**
 * Check if request is within rate limit
 * Uses PostgreSQL function with advisory locks for thread-safety
 *
 * @param identifier - Client identifier (IP or user ID)
 * @param endpoint - API endpoint being rate limited
 * @param limit - Maximum requests allowed in window
 * @param windowSeconds - Time window in seconds
 * @returns Rate limit check result
 */
export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  limit: number,
  windowSeconds: number
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  try {
    const { data, error } = await supabaseAdmin.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_endpoint: endpoint,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });

    if (error) {
      console.error('Error checking rate limit:', error);
      // On error, allow request (fail open)
      return {
        allowed: true,
        limit,
        remaining: limit,
        reset: Date.now() + windowSeconds * 1000,
      };
    }

    if (!data || data.length === 0) {
      // No data returned, allow request
      return {
        allowed: true,
        limit,
        remaining: limit,
        reset: Date.now() + windowSeconds * 1000,
      };
    }

    const result = data[0];
    return {
      allowed: result.allowed,
      limit: result.limit_value,
      remaining: Math.max(0, result.limit_value - result.current_count),
      reset: new Date(result.window_reset).getTime(),
    };
  } catch (error) {
    console.error('Exception in checkRateLimit:', error);
    // On exception, allow request (fail open)
    return {
      allowed: true,
      limit,
      remaining: limit,
      reset: Date.now() + windowSeconds * 1000,
    };
  }
}

/**
 * Apply multiple rate limits (all must pass)
 * Used to combine per-minute limits with burst protection
 *
 * @param identifier - Client identifier
 * @param checks - Array of rate limit checks to apply
 * @returns Combined rate limit result
 */
export async function checkMultipleRateLimits(
  identifier: string,
  checks: Array<{ endpoint: string; limit: number; windowSeconds: number }>
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
  failedCheck?: string;
}> {
  // Handle edge case: empty checks array
  if (!checks || checks.length === 0) {
    return {
      allowed: true,
      limit: 0,
      remaining: 0,
      reset: Date.now(),
    };
  }

  let firstResult: Awaited<ReturnType<typeof checkRateLimit>> | null = null;

  for (let i = 0; i < checks.length; i++) {
    const check = checks[i];
    const result = await checkRateLimit(
      identifier,
      check.endpoint,
      check.limit,
      check.windowSeconds
    );

    // Store first result
    if (i === 0) {
      firstResult = result;
    }

    if (!result.allowed) {
      return {
        ...result,
        failedCheck: check.endpoint,
      };
    }
  }

  // All checks passed - return first check's details (already incremented)
  return firstResult!;
}
