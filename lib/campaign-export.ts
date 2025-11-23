import { csvRow } from '@/lib/csv';

const METRO_RADIUS_MILES = 30;

export interface Vehicle {
  id: string;
  latitude: number;
  longitude: number;
  dealer_id: string;
  dma?: string;
  dealer_city?: string;
  dealer_state?: string;
  make?: string;
  model?: string;
  body_style?: string;
  [key: string]: unknown;
}

export interface MetroLocation {
  metro: string;
  latitude: number;
  longitude: number;
  radius_miles: number;
  vehicles: number;
  dealers: number;
}

export const VALID_CAMPAIGN_TYPES = ['body_style', 'make', 'make_body_style', 'make_model'] as const;
export type CampaignType = typeof VALID_CAMPAIGN_TYPES[number];

export const VALID_PLATFORMS = ['facebook', 'google'] as const;
export type Platform = typeof VALID_PLATFORMS[number];

/**
 * Calculate metro-level targeting locations from qualifying metros
 */
export function calculateMetroLocations(
  qualifyingMetros: Array<[string, Vehicle[]]>)
: MetroLocation[] {
  return qualifyingMetros
    .map(([metro, vehicles]) => {
      const dealersInMetro = vehicles.filter((v) => v.latitude != null && v.longitude != null);
      if (dealersInMetro.length === 0) return null;

      const avgLat =
        dealersInMetro.reduce((sum, v) => sum + v.latitude, 0) / dealersInMetro.length;
      const avgLon =
        dealersInMetro.reduce((sum, v) => sum + v.longitude, 0) / dealersInMetro.length;

      return {
        metro: metro,
        latitude: avgLat,
        longitude: avgLon,
        radius_miles: METRO_RADIUS_MILES,
        vehicles: vehicles.length,
        dealers: new Set(vehicles.map((v) => v.dealer_id)).size,
      };
    })
    .filter((m): m is MetroLocation => m !== null);
}

/**
 * Generate destination URL for the campaign landing page
 */
export function generateDestinationUrl(campaignType: CampaignType, campaignValue: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carzo.net';
  const searchPath = '/search';
  const url = new URL(searchPath, baseUrl);

  switch (campaignType) {
    case 'body_style':
      url.searchParams.set('body_style', campaignValue);
      break;
    case 'make':
      url.searchParams.set('make', campaignValue);
      break;
    case 'make_body_style': {
      const parts = campaignValue.split(' ');
      if (parts.length >= 2) {
        url.searchParams.set('make', parts[0]);
        url.searchParams.set('body_style', parts.slice(1).join(' '));
      }
      break;
    }
    case 'make_model': {
      const parts = campaignValue.split(' ');
      if (parts.length >= 2) {
        url.searchParams.set('make', parts[0]);
        url.searchParams.set('model', parts.slice(1).join(' '));
      }
      break;
    }
  }

  return url.toString();
}

/**
 * Generate CSV content with platform-specific headers
 */
export function generateCsvContent(
  platform: Platform,
  locations: MetroLocation[],
  destinationUrl: string
): string {
  const isFacebook = platform === 'facebook';
  const header = csvRow(isFacebook
    ? ['name', 'lat', 'long', 'radius', 'distance_unit', 'destination_url', 'vehicle_count', 'dealer_count']
    : ['Target Location', 'Latitude', 'Longitude', 'Radius', 'Unit', 'Destination URL', 'Vehicle Count', 'Dealer Count']);
  const distanceUnit = isFacebook ? 'mile' : 'mi';

  const rows = locations.map((m) =>
    csvRow([
      m.metro,
      m.latitude.toFixed(4),
      m.longitude.toFixed(4),
      m.radius_miles,
      distanceUnit,
      destinationUrl,
      m.vehicles,
      m.dealers,
    ])
  );

  return [header, ...rows].join('\n');
}
