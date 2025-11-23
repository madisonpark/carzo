import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminAuth } from '@/lib/admin-auth';
import {
  calculateMetroLocations,
  generateDestinationUrl,
  generateCsvContent,
  VALID_CAMPAIGN_TYPES,
  VALID_PLATFORMS,
  CampaignType,
  Platform,
  Vehicle,
} from '@/lib/campaign-export';

export const dynamic = 'force-dynamic';

// Input validation limits (prevent DoS via large inputs)
const MAX_CAMPAIGN_VALUE_LENGTH = 100;

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
