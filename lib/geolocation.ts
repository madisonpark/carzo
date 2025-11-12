/**
 * MaxMind GeoIP2 Integration
 * Detects user location based on IP address
 */

import { WebServiceClient } from '@maxmind/geoip2-node';

export interface UserLocation {
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  postalCode?: string;
}

// Initialize MaxMind client
let geoipClient: WebServiceClient | null = null;

function getClient(): WebServiceClient {
  if (!geoipClient) {
    const accountId = process.env.MAXMIND_ACCOUNT_ID;
    const licenseKey = process.env.MAXMIND_LICENSE_KEY;

    if (!accountId || !licenseKey) {
      throw new Error('MaxMind credentials not configured');
    }

    geoipClient = new WebServiceClient(accountId, licenseKey);
  }

  return geoipClient;
}

/**
 * Get user location from IP address
 */
export async function getLocationFromIP(ipAddress: string): Promise<UserLocation | null> {
  try {
    const client = getClient();
    const response = await client.city(ipAddress);

    if (!response.city?.names?.en || !response.location?.latitude || !response.location?.longitude) {
      return null;
    }

    return {
      city: response.city.names.en,
      state: response.subdivisions?.[0]?.isoCode || '',
      latitude: response.location.latitude,
      longitude: response.location.longitude,
      postalCode: response.postal?.code,
    };
  } catch (error) {
    console.error('Error fetching geolocation:', error);
    return null;
  }
}

/**
 * Calculate distance between two coordinates (in miles)
 * Uses Haversine formula
 *
 * @deprecated This function is no longer used in production code.
 * Location-based search now uses PostGIS ST_Distance for better performance.
 * Kept for backward compatibility and testing purposes.
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance);
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Get distance label for display
 *
 * @deprecated Not currently used. Kept for potential future use.
 */
export function getDistanceLabel(miles: number): string {
  if (miles < 1) {
    return 'Nearby';
  } else if (miles < 50) {
    return `${miles} miles away`;
  } else if (miles < 100) {
    return `${miles} miles away`;
  } else {
    return `${miles}+ miles away`;
  }
}
