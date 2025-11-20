import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminAuth } from '@/lib/admin-auth';
import { sanitizeCsvField } from '@/lib/csv';

export const dynamic = 'force-dynamic';

const VALID_CAMPAIGN_TYPES = ['body_style', 'make', 'make_body_style', 'make_model'] as const;
const VALID_PLATFORMS = ['facebook', 'google'] as const;
const METRO_RADIUS_MILES = 30; // Default radius to cover all dealers in metro + surrounding area

// Input validation limits (prevent DoS via large inputs)
const MAX_CAMPAIGN_VALUE_LENGTH = 100;

type CampaignType = typeof VALID_CAMPAIGN_TYPES[number];
type Platform = typeof VALID_PLATFORMS[number];

interface Vehicle {
  id: string;
  latitude: number;
  longitude: number;
  dealer_id: string;
  dma?: string;
  dealer_city?: string;
  dealer_state?: string;
  [key: string]: unknown; // Allow other fields from select('*')
}

interface MetroLocation {
  metro: string;
  latitude: number;
  longitude: number;
  radius_miles: number;
  vehicles: number;
  dealers: number;
}

/**
 * Calculate metro-level targeting locations from qualifying metros
 * Groups vehicles by metro and calculates centroid + stats for each metro
 */
function calculateMetroLocations(
  qualifyingMetros: Array<[string, Vehicle[]]>
): MetroLocation[] {
  return qualifyingMetros
    .map(([metro, vehicles]) => {
      // Calculate centroid of all dealers in this metro
      // Use explicit null/undefined checks to avoid filtering out latitude/longitude = 0
      const dealersInMetro = vehicles.filter((v) => v.latitude != null && v.longitude != null);

      // Skip metros with no valid coordinates (prevent division by zero)
      if (dealersInMetro.length === 0) {
        return null;
      }

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
        dealers: new Set(vehicles.map((v: Vehicle) => v.dealer_id)).size,
      };
    })
    .filter((m): m is MetroLocation => m !== null); // Remove nulls
}

/**
 * Generate destination URL for the campaign landing page
 * 
 * Examples:
 * - Body Style: https://carzo.net/search?body_style=SUV
 * - Make: https://carzo.net/search?make=Kia
 * - Make+Body: https://carzo.net/search?make=Kia&body_style=SUV
 * - Make+Model: https://carzo.net/search?make=Kia&model=Sorrento
 */
function generateDestinationUrl(campaignType: CampaignType, campaignValue: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carzo.net';
  const searchPath = '/search';
  const url = new URL(searchPath, baseUrl);

  // Add campaign parameters
  if (campaignType === 'body_style') {
    url.searchParams.set('body_style', campaignValue);
  } else if (campaignType === 'make') {
    url.searchParams.set('make', campaignValue);
  } else if (campaignType === 'make_body_style') {
    const parts = campaignValue.split(' ');
    if (parts.length >= 2) {
      url.searchParams.set('make', parts[0]);
      url.searchParams.set('body_style', parts.slice(1).join(' '));
    }
  } else if (campaignType === 'make_model') {
    const parts = campaignValue.split(' ');
    if (parts.length >= 2) {
      url.searchParams.set('make', parts[0]);
      // Join the rest as model (e.g. "Grand Cherokee")
      url.searchParams.set('model', parts.slice(1).join(' '));
    }
  }

  return url.toString();
}

/**
 * Generate CSV content with platform-specific headers
 */
function generateCsvContent(
  platform: Platform, 
  locations: MetroLocation[], 
  destinationUrl: string
): string {
  if (platform === 'facebook') {
    // Facebook Headers: name, lat, long, radius, distance_unit, [custom: destination_url, vehicle_count, dealer_count]
    const header = 'name,lat,long,radius,distance_unit,destination_url,vehicle_count,dealer_count';
    const rows = locations.map(m => 
      `${sanitizeCsvField(m.metro)},${m.latitude.toFixed(4)},${m.longitude.toFixed(4)},${m.radius_miles},mile,${destinationUrl},${m.vehicles},${m.dealers}`
    );
    return [header, ...rows].join('\n');
  } else {
    // Google Headers (standard bulk upload): Target Location, Latitude, Longitude, Radius, Unit, [custom columns]
    const header = 'Target Location,Latitude,Longitude,Radius,Unit,Destination URL,Vehicle Count,Dealer Count';
    const rows = locations.map(m => 
      `${sanitizeCsvField(m.metro)},${m.latitude.toFixed(4)},${m.longitude.toFixed(4)},${m.radius_miles},mi,${destinationUrl},${m.vehicles},${m.dealers}`
    );
    return [header, ...rows].join('\n');
  }
}

/**
 * Export combined multi-metro targeting for a campaign type
 * Returns ONE CSV with all metros that have sufficient inventory
 *
 * Query params:
 * - campaign_type: body_style | make | make_body_style | make_model
 * - campaign_value: e.g., "suv", "Kia", "Kia suv", "Jeep Grand Cherokee"
 * - platform: facebook | google | tiktok
 * - min_vehicles: minimum vehicles per metro (default: 6)
 * - max_metros: safety limit (default: 100)
 */
export async function GET(request: NextRequest) {
  // Validate auth and rate limiting
  const authResult = await validateAdminAuth(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  const { searchParams } = new URL(request.url);
  const rawCampaignType = searchParams.get('campaign_type');
  const campaignValue = searchParams.get('campaign_value');
  const rawPlatform = searchParams.get('platform') || 'facebook';
  const minVehicles = parseInt(searchParams.get('min_vehicles') || '6');
  const maxMetros = parseInt(searchParams.get('max_metros') || '100');

  // Validate required params
  if (!rawCampaignType || !campaignValue) {
    return NextResponse.json(
      { error: 'campaign_type and campaign_value are required' },
      { status: 400 }
    );
  }

  // Normalize and validate campaign type (case-insensitive)
  const campaignType = rawCampaignType.toLowerCase() as CampaignType;
  if (!VALID_CAMPAIGN_TYPES.includes(campaignType)) {
    return NextResponse.json(
      { error: `Invalid campaign_type. Must be one of: ${VALID_CAMPAIGN_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  // Normalize and validate platform (case-insensitive)
  const platform = rawPlatform.toLowerCase() as Platform;
  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json(
      { error: `Invalid platform. Must be one of: ${VALID_PLATFORMS.join(', ')}` },
      { status: 400 }
    );
  }

  // Validate campaign_value is not empty after trimming
  const trimmedCampaignValue = campaignValue.trim();
  if (!trimmedCampaignValue) {
    return NextResponse.json(
      { error: 'campaign_value cannot be empty' },
      { status: 400 }
    );
  }

  // Validate input length (prevent DoS via large inputs)
  if (trimmedCampaignValue.length > MAX_CAMPAIGN_VALUE_LENGTH) {
    return NextResponse.json(
      { error: `campaign_value too long (max ${MAX_CAMPAIGN_VALUE_LENGTH} characters)` },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Build query based on campaign type
    let query = supabase.from('vehicles').select('*').eq('is_active', true);

    if (campaignType === 'body_style') {
      query = query.eq('body_style', trimmedCampaignValue);
    } else if (campaignType === 'make') {
      query = query.eq('make', trimmedCampaignValue);
    } else if (campaignType === 'make_body_style') {
      const parts = trimmedCampaignValue.split(' ');

      // Validate we have at least 2 parts (make + body_style)
      if (parts.length < 2) {
        return NextResponse.json(
          { error: 'make_body_style requires format: "Make BodyStyle" (e.g., "Kia suv")' },
          { status: 400 }
        );
      }

      const make = parts[0];
      const bodyStyle = parts.slice(1).join(' '); // Handle multi-word body styles

      // Validate neither part is empty
      if (!make || !bodyStyle) {
        return NextResponse.json(
          { error: 'make_body_style format invalid: both make and body_style are required' },
          { status: 400 }
        );
      }

      query = query.eq('make', make).eq('body_style', bodyStyle);
    } else if (campaignType === 'make_model') {
      const parts = trimmedCampaignValue.split(' ');

      // Validate we have at least 2 parts (make + model)
      if (parts.length < 2) {
        return NextResponse.json(
          { error: 'make_model requires format: "Make Model" (e.g., "Jeep Wrangler")' },
          { status: 400 }
        );
      }

      const make = parts[0];
      const model = parts.slice(1).join(' '); // Handle multi-word models

      // Validate neither part is empty
      if (!make || !model) {
        return NextResponse.json(
          { error: 'make_model format invalid: both make and model are required' },
          { status: 400 }
        );
      }

      query = query.eq('make', make).eq('model', model);
    }

    const { data: vehiclesData, error } = await query;

    if (error) throw error;

    // Runtime validation: Ensure query returns expected array format
    if (!vehiclesData || !Array.isArray(vehiclesData)) {
      throw new Error('Unexpected response format from vehicles query');
    }

    const vehicles: Vehicle[] = vehiclesData;

    if (vehicles.length === 0) {
      return NextResponse.json(
        { error: `No active vehicles found for campaign: ${campaignValue}` },
        { status: 404 }
      );
    }

    // Group by metro, count vehicles
    const metroMap = new Map<string, Vehicle[]>();
    for (const vehicle of vehicles) {
      const metro = vehicle.dma || `${vehicle.dealer_city}, ${vehicle.dealer_state}`;
      if (!metroMap.has(metro)) {
        metroMap.set(metro, []);
      }
      metroMap.get(metro)!.push(vehicle);
    }

    // Filter metros with >= minVehicles
    const qualifyingMetros = Array.from(metroMap.entries())
      .filter(([, vehicles]) => vehicles.length >= minVehicles)
      .sort(([, a], [, b]) => b.length - a.length) // Sort by vehicle count descending
      .slice(0, maxMetros); // Limit to maxMetros

    if (qualifyingMetros.length === 0) {
      return NextResponse.json(
        {
          error: `No metros found with >=${minVehicles} vehicles for campaign: ${campaignValue}`,
          suggestion: `Try lowering min_vehicles parameter or choosing a different campaign type`,
        },
        { status: 404 }
      );
    }

    // Calculate metro-level targeting locations (used by both platforms)
    const metroLocations = calculateMetroLocations(qualifyingMetros);

    // Generate destination URL
    const destinationUrl = generateDestinationUrl(campaignType, trimmedCampaignValue);

    // Generate CSV with platform-specific headers
    const csv = generateCsvContent(platform, metroLocations, destinationUrl);

    const filename = `${platform}-targeting-${trimmedCampaignValue.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${qualifyingMetros.length}-metros.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: unknown) {
    console.error('Error exporting combined targeting:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to export targeting', details: errorMessage },
      { status: 500 }
    );
  }
}
