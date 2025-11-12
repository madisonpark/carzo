import { NextRequest, NextResponse } from 'next/server';
import { getLocationFromIP } from '@/lib/geolocation';

/**
 * API endpoint to detect user location from IP address
 * Uses MaxMind GeoIP2 for accurate geolocation
 */
export async function GET(request: NextRequest) {
  try {
    // Get IP address from request
    // In production on Vercel, use x-forwarded-for header
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    const ipAddress = forwardedFor?.split(',')[0].trim() || realIp || 'unknown';

    // For local development, return Atlanta, GA
    if (ipAddress === '::1' || ipAddress === '127.0.0.1' || ipAddress === 'unknown') {
      console.log('Localhost detected - returning Atlanta, GA for testing');
      return NextResponse.json({
        success: true,
        location: {
          city: 'Atlanta',
          state: 'GA',
          latitude: 33.7490,
          longitude: -84.3880,
          postalCode: '30303',
        },
      });
    }

    console.log('Detecting location for IP:', ipAddress);

    // Get location from MaxMind
    const location = await getLocationFromIP(ipAddress);

    if (!location) {
      return NextResponse.json(
        { error: 'Could not determine location' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      location: {
        city: location.city,
        state: location.state,
        latitude: location.latitude,
        longitude: location.longitude,
        postalCode: location.postalCode,
      },
    });
  } catch (error) {
    console.error('Error detecting location:', error);
    return NextResponse.json(
      {
        error: 'Failed to detect location',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Allow caching for 1 hour
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
