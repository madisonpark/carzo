import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminAuth } from '@/lib/admin-auth';
import { sanitizeCsvField, generateCsv } from '@/lib/csv';


export const dynamic = 'force-dynamic';

// Input validation limits (prevent DoS via large inputs)
const MAX_METRO_LENGTH = 100;
const MAX_FILTER_LENGTH = 50;
const VALID_FILTER_REGEX = /^[a-zA-Z0-9\s-]+$/;

/**
 * Generate destination URL for the campaign landing page
 */
function generateDestinationUrl(make: string | null, bodyStyle: string | null): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://carzo.net';
  const searchPath = '/search';
  const url = new URL(searchPath, baseUrl);

  if (make) {
    url.searchParams.set('make', make);
  }
  
  if (bodyStyle) {
    url.searchParams.set('body_style', bodyStyle);
  }

  return url.toString();
}

/**
 * Export geographic targeting lists for ad platforms
 *
 * Query params:
 * - metro: City, State (e.g., "Tampa, FL")
 * - platform: facebook | google | tiktok (default: facebook)
 * - format: csv | json (default: csv)
 *
 * @returns CSV or JSON download
 */
interface ZipResult {
  zip_code: string;
}

export async function GET(request: NextRequest) {
  // Validate auth and rate limiting
  const authResult = await validateAdminAuth(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  const { searchParams } = new URL(request.url);
  const metro = searchParams.get('metro'); // e.g., "Tampa, FL"
  const platform = searchParams.get('platform') || 'facebook';
  const format = searchParams.get('format') || 'csv';
  const make = searchParams.get('make');
  const bodyStyle = searchParams.get('body_style');

  // Validate required params
  if (!metro) {
    return NextResponse.json({ error: 'metro parameter required' }, { status: 400 });
  }

  // Validate input lengths (prevent DoS via large inputs)
  if (metro.length > MAX_METRO_LENGTH) {
    return NextResponse.json(
      { error: `metro parameter too long (max ${MAX_METRO_LENGTH} characters)` },
      { status: 400 }
    );
  }

  if (make) {
    if (make.length > MAX_FILTER_LENGTH) {
      return NextResponse.json(
        { error: `make parameter too long (max ${MAX_FILTER_LENGTH} characters)` },
        { status: 400 }
      );
    }
    if (!VALID_FILTER_REGEX.test(make)) {
      return NextResponse.json(
        { error: 'make parameter contains invalid characters' },
        { status: 400 }
      );
    }
  }

  if (bodyStyle) {
    if (bodyStyle.length > MAX_FILTER_LENGTH) {
      return NextResponse.json(
        { error: `body_style parameter too long (max ${MAX_FILTER_LENGTH} characters)` },
        { status: 400 }
      );
    }
    if (!VALID_FILTER_REGEX.test(bodyStyle)) {
      return NextResponse.json(
        { error: 'body_style parameter contains invalid characters' },
        { status: 400 }
      );
    }
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Parse metro into city and state
    const [city, state] = metro.split(', ');

    if (platform === 'facebook') {
      // Export lat/long radius targeting for Facebook
      let query = supabase
        .from('vehicles')
        .select('latitude, longitude, dealer_name, dealer_id')
        .eq('dealer_city', city)
        .eq('dealer_state', state)
        .eq('is_active', true);

      if (make) {
        query = query.eq('make', make);
      }

      if (bodyStyle) {
        query = query.eq('body_style', bodyStyle);
      }

      const { data: dealers, error } = await query;

      if (error) throw error;

      if (!dealers || dealers.length === 0) {
        // Build descriptive error message with filter context
        const filters = [];
        if (make) filters.push(`make: ${make}`);
        if (bodyStyle) filters.push(`body_style: ${bodyStyle}`);

        const filterContext = filters.length > 0
          ? ` with filters (${filters.join(', ')})`
          : '';

        return NextResponse.json(
          {
            error: `No active dealers found for metro: ${metro}${filterContext}`,
            suggestion: filters.length > 0
              ? 'Try removing filters or choosing a different metro'
              : 'Metro may have no active inventory'
          },
          { status: 404 }
        );
      }

      // Get unique dealers and their vehicle counts in one pass (O(N) instead of O(N*M))
      const dealerData = new Map<
        string,
        { latitude: number; longitude: number; dealer_name: string; vehicle_count: number }
      >();

      for (const d of dealers) {
        const existing = dealerData.get(d.dealer_id);
        if (existing) {
          existing.vehicle_count++;
        } else {
          dealerData.set(d.dealer_id, {
            latitude: d.latitude,
            longitude: d.longitude,
            dealer_name: d.dealer_name,
            vehicle_count: 1,
          });
        }
      }

      const destinationUrl = generateDestinationUrl(make, bodyStyle);

      const rows = Array.from(dealerData.values()).map(dealer => ({
        latitude: dealer.latitude,
        longitude: dealer.longitude,
        radius_miles: 25,
        dealer_name: dealer.dealer_name,
        vehicle_count: dealer.vehicle_count,
        destination_url: destinationUrl
      }));

      if (format === 'csv') {
        const csv = [
          'latitude,longitude,radius_miles,dealer_name,vehicle_count,destination_url',
          ...rows.map(
            r => `${r.latitude},${r.longitude},${r.radius_miles},${sanitizeCsvField(r.dealer_name)},${r.vehicle_count},${r.destination_url}`
          ),
        ].join('\n');

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="facebook-targeting-${city.replace(/\s+/g, '-').toLowerCase()}.csv"`,
          },
        });
      }

      return NextResponse.json(rows);
    } else if (platform === 'google') {
      // Export ZIP codes within 25 miles of dealers
      // Uses bulk function to avoid N+1 query problem
      const { data: zipCodesData, error: zipError } = await supabase.rpc('get_zips_for_metro', {
        p_city: city,
        p_state: state,
        p_radius_miles: 25,
        p_make: make || null,
        p_body_style: bodyStyle || null,
      });

      if (zipError) throw zipError;

      // Runtime validation: Ensure RPC returns expected array format
      if (!Array.isArray(zipCodesData)) {
        throw new Error('Unexpected response format from get_zips_for_metro RPC function');
      }

      const zipCodes: ZipResult[] = zipCodesData;

      if (zipCodes.length === 0) {
        return NextResponse.json(
          { error: `No ZIP codes found for metro: ${metro}. This metro may not have active dealers.` },
          { status: 404 }
        );
      }

      const destinationUrl = generateDestinationUrl(make, bodyStyle);

      const rows = (zipCodes || []).map((z: ZipResult) => ({
        zip_code: z.zip_code,
        destination_url: destinationUrl
      }));

      if (format === 'csv') {
        const csv = [
          'zip_code,destination_url',
          ...rows.map(r => `${r.zip_code},${r.destination_url}`)
        ].join('\n');

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="google-targeting-${city.replace(/\s+/g, '-').toLowerCase()}.csv"`,
          },
        });
      }

      return NextResponse.json(rows);
    } else if (platform === 'tiktok') {
      // Validate that matching inventory exists in this metro
      let query = supabase
        .from('vehicles')
        .select('id', { count: 'exact', head: true })
        .eq('dealer_city', city)
        .eq('dealer_state', state)
        .eq('is_active', true);

      if (make) {
        query = query.eq('make', make);
      }

      if (bodyStyle) {
        query = query.eq('body_style', bodyStyle);
      }

      const { count, error } = await query;

      if (error) throw error;

      if (count === 0) {
        const filters = [];
        if (make) filters.push(`make: ${make}`);
        if (bodyStyle) filters.push(`body_style: ${bodyStyle}`);

        const filterContext = filters.length > 0
          ? ` with filters (${filters.join(', ')})`
          : '';

        return NextResponse.json(
          {
            error: `No active dealers found for metro: ${metro}${filterContext}`,
            suggestion: filters.length > 0
              ? 'Try removing filters or choosing a different metro'
              : 'Metro may have no active inventory'
          },
          { status: 404 }
        );
      }

      // Export DMA (will work once DMA column is added)
      const destinationUrl = generateDestinationUrl(make, bodyStyle);
      const rows = [{ dma: metro, destination_url: destinationUrl }]; 

      if (format === 'csv') {
        const csv = generateCsv(
          ['dma', 'destination_url'], 
          [[metro, destinationUrl]]
        );

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="tiktok-targeting-${city.replace(/\s+/g, '-').toLowerCase()}.csv"`,
          },
        });
      }

      return NextResponse.json(rows);
    }

    return NextResponse.json({ error: 'Invalid platform' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error exporting targeting:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to export targeting', details: errorMessage },
      { status: 500 }
    );
  }
}
