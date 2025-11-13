/**
 * Admin Authentication Utilities
 * Simple password-based auth for admin endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientIdentifier, checkMultipleRateLimits, RATE_LIMITS } from './rate-limit';

export interface AdminAuthResult {
  authorized: boolean;
  response?: NextResponse;
}

/**
 * Validate admin authentication and rate limiting
 * Returns { authorized: true } if valid, or { authorized: false, response } with error response
 */
export async function validateAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  // 1. Check environment variable is set
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.error('ADMIN_PASSWORD environment variable not set');
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      ),
    };
  }

  // 2. Check rate limiting first (prevent brute force)
  const identifier = getClientIdentifier(request);

  const rateLimitResult = await checkMultipleRateLimits(identifier, [
    { endpoint: 'admin_api', ...RATE_LIMITS.FILTER_OPTIONS }, // 50/min
  ]);

  if (!rateLimitResult.allowed) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': new Date(rateLimitResult.reset * 1000).toISOString(),
          },
        }
      ),
    };
  }

  // 3. Validate password
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${adminPassword}`;

  if (!authHeader || authHeader !== expectedAuth) {
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { authorized: true };
}
