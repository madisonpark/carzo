import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminAuth } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

const VALID_CAMPAIGN_TYPES = ['body_style', 'make', 'make_body_style', 'make_model'] as const;
const VALID_PLATFORMS = ['facebook', 'google'] as const;
const METRO_RADIUS_MILES = 30; // Default radius to cover all dealers in metro + surrounding area

type CampaignType = typeof VALID_CAMPAIGN_TYPES[number];
type Platform = typeof VALID_PLATFORMS[number];

interface MetroLocation {
  metro: string;
  latitude: number;
  longitude: number;
  radius_miles: number;
  vehicles: number;
  dealers: number;
}

/**
 * Sanitize field for CSV export to prevent formula injection
 */
function sanitizeCsvField(value: string): string {
  if (!value) return '""';

  // Prevent formula injection (leading =, +, -, @, tab, carriage return)
  let sanitized = value;
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = `'${sanitized}`; // Prefix with single quote
  }

  // Escape double quotes
  sanitized = sanitized.replace(/"/g, '""');

  // Remove newlines
  sanitized = sanitized.replace(/[\r\n]/g, ' ');

  return `"${sanitized}"`;
}

/**
 * Calculate metro-level targeting locations from qualifying metros
 * Groups vehicles by metro and calculates centroid + stats for each metro
 */
function calculateMetroLocations(
  qualifyingMetros: Array<[string, any[]]>
): MetroLocation[] {
  return qualifyingMetros
    .map(([metro, vehicles]) => {
      // Calculate centroid of all dealers in this metro
      const dealersInMetro = vehicles.filter((v: any) => v.latitude && v.longitude);

      // Skip metros with no valid coordinates (prevent division by zero)
      if (dealersInMetro.length === 0) {
        return null;
      }

      const avgLat =
        dealersInMetro.reduce((sum: number, v: any) => sum + v.latitude, 0) /
        dealersInMetro.length;
      const avgLon =
        dealersInMetro.reduce((sum: number, v: any) => sum + v.longitude, 0) /
        dealersInMetro.length;

      return {
        metro: metro,
        latitude: avgLat,
        longitude: avgLon,
        radius_miles: METRO_RADIUS_MILES,
        vehicles: vehicles.length,
        dealers: new Set(vehicles.map((v: any) => v.dealer_id)).size,
      };
    })
    .filter((m): m is MetroLocation => m !== null); // Remove nulls
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

    const { data: vehicles, error } = await query;

    if (error) throw error;

    if (!vehicles || vehicles.length === 0) {
      return NextResponse.json(
        { error: `No active vehicles found for campaign: ${campaignValue}` },
        { status: 404 }
      );
    }

    // Group by metro, count vehicles
    const metroMap = new Map<string, typeof vehicles>();
    for (const vehicle of vehicles) {
      const metro = vehicle.dma || `${vehicle.dealer_city}, ${vehicle.dealer_state}`;
      if (!metroMap.has(metro)) {
        metroMap.set(metro, []);
      }
      metroMap.get(metro)!.push(vehicle);
    }

    // Filter metros with >= minVehicles
    const qualifyingMetros = Array.from(metroMap.entries())
      .filter(([_, vehicles]) => vehicles.length >= minVehicles)
      .sort(([_, a], [__, b]) => b.length - a.length) // Sort by vehicle count descending
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

    // Flatten to all vehicles in qualifying metros
    const qualifyingVehicles = qualifyingMetros.flatMap(([_, vehicles]) => vehicles);

    // Calculate metro-level targeting locations (used by both platforms)
    const metroLocations = calculateMetroLocations(qualifyingMetros);

    // Generate CSV with lat/long + radius targeting
    const csv = [
      'metro,latitude,longitude,radius_miles,vehicles,dealers',
      ...metroLocations.map(
        (m) =>
          `${sanitizeCsvField(m.metro)},${m.latitude.toFixed(4)},${m.longitude.toFixed(4)},${m.radius_miles},${m.vehicles},${m.dealers}`
      ),
    ].join('\n');

    const filename = `${platform}-targeting-${trimmedCampaignValue.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${qualifyingMetros.length}-metros.csv`;

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error: any) {
    console.error('Error exporting combined targeting:', error);
    return NextResponse.json(
      { error: 'Failed to export targeting', details: error.message },
      { status: 500 }
    );
  }
}
