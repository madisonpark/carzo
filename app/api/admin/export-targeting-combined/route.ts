import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminAuth } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

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
  const campaignType = searchParams.get('campaign_type');
  const campaignValue = searchParams.get('campaign_value');
  const platform = searchParams.get('platform') || 'facebook';
  const minVehicles = parseInt(searchParams.get('min_vehicles') || '6');
  const maxMetros = parseInt(searchParams.get('max_metros') || '100');

  // Validate required params
  if (!campaignType || !campaignValue) {
    return NextResponse.json(
      { error: 'campaign_type and campaign_value are required' },
      { status: 400 }
    );
  }

  if (!['body_style', 'make', 'make_body_style', 'make_model'].includes(campaignType)) {
    return NextResponse.json(
      { error: 'Invalid campaign_type. Must be: body_style, make, make_body_style, or make_model' },
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
      query = query.eq('body_style', campaignValue);
    } else if (campaignType === 'make') {
      query = query.eq('make', campaignValue);
    } else if (campaignType === 'make_body_style') {
      const [make, bodyStyle] = campaignValue.split(' ');
      query = query.eq('make', make).eq('body_style', bodyStyle);
    } else if (campaignType === 'make_model') {
      const [make, ...modelParts] = campaignValue.split(' ');
      const model = modelParts.join(' ');
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

    // Export based on platform
    if (platform === 'facebook') {
      // Get metro-level targeting (one row per metro with centroid + radius)
      // Facebook will target everyone within radius_miles of each metro centroid
      const metroLocations = qualifyingMetros.map(([metro, vehicles]) => {
        // Calculate centroid of all dealers in this metro
        const dealersInMetro = vehicles.filter(v => v.latitude && v.longitude);
        const avgLat = dealersInMetro.reduce((sum, v) => sum + v.latitude, 0) / dealersInMetro.length;
        const avgLon = dealersInMetro.reduce((sum, v) => sum + v.longitude, 0) / dealersInMetro.length;

        return {
          metro: metro,
          latitude: avgLat,
          longitude: avgLon,
          radius_miles: 30, // Covers all dealers in metro + surrounding area
          vehicles: vehicles.length,
          dealers: new Set(vehicles.map(v => v.dealer_id)).size,
        };
      });

      const csv = [
        'metro,latitude,longitude,radius_miles,vehicles,dealers',
        ...metroLocations.map(
          (m) =>
            `"${m.metro}",${m.latitude.toFixed(4)},${m.longitude.toFixed(4)},${m.radius_miles},${m.vehicles},${m.dealers}`
        ),
      ].join('\n');

      const filename = `facebook-targeting-${campaignValue.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${qualifyingMetros.length}-metros.csv`;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    } else if (platform === 'google') {
      // Get all metros, query ZIP codes in bulk
      const metros = qualifyingMetros.map(([metro]) => {
        const [city, state] = metro.split(', ');
        return { city, state };
      });

      // For now, return simple metro list (ZIP lookup would be too slow for multiple metros)
      // In production, would batch ZIP lookups or pre-compute
      const csv = [
        'metro,vehicles',
        ...qualifyingMetros.map(([metro, vehicles]) => `"${metro}",${vehicles.length}`),
      ].join('\n');

      const filename = `google-targeting-${campaignValue.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${qualifyingMetros.length}-metros.csv`;

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  } catch (error: any) {
    console.error('Error exporting combined targeting:', error);
    return NextResponse.json(
      { error: 'Failed to export targeting', details: error.message },
      { status: 500 }
    );
  }
}
