/**
 * Admin Authentication Utilities
 * Simple password-based auth for admin endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientIdentifier, checkMultipleRateLimits, RATE_LIMITS } from './rate-limit';

export interface AdminAuthResult {
  authorized: boolean;
  response?: Response;
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

  // 3. Validate password (Bearer token OR cookie)
  const authHeader = request.headers.get('authorization');
  const expectedAuth = `Bearer ${adminPassword}`;

  // Check Bearer token first
  if (authHeader && authHeader === expectedAuth) {
    return { authorized: true };
  }

  // Check cookie auth (for browser requests from admin dashboard)
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const authCookie = cookieHeader
      .split('; ')
      .find(row => row.startsWith('carzo_admin_auth='));

    if (authCookie) {
      const cookieValue = authCookie.split('=')[1];
      if (cookieValue === adminPassword) {
        return { authorized: true };
      }
    }
  }

  return {
    authorized: false,
    response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
  };
}
