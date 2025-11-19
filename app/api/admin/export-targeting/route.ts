import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminAuth } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

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

  if (!metro) {
    return NextResponse.json({ error: 'metro parameter required' }, { status: 400 });
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
        return NextResponse.json(
          { error: `No active dealers found for metro: ${metro}` },
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

      const rows = Array.from(dealerData.values()).map(dealer => ({
        latitude: dealer.latitude,
        longitude: dealer.longitude,
        radius_miles: 25,
        dealer_name: dealer.dealer_name,
        vehicle_count: dealer.vehicle_count,
      }));

      if (format === 'csv') {
        const csv = [
          'latitude,longitude,radius_miles,dealer_name,vehicle_count',
          ...rows.map(
            r => `${r.latitude},${r.longitude},${r.radius_miles},${sanitizeCsvField(r.dealer_name)},${r.vehicle_count}`
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

      const rows = (zipCodes || []).map((z: ZipResult) => ({ zip_code: z.zip_code }));

      if (format === 'csv') {
        const csv = ['zip_code', ...rows.map((r: { zip_code: string }) => r.zip_code)].join('\n');

        return new NextResponse(csv, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="google-targeting-${city.replace(/\s+/g, '-').toLowerCase()}.csv"`,
          },
        });
      }

      return NextResponse.json(rows);
    } else if (platform === 'tiktok') {
      // Export DMA (will work once DMA column is added)
      const rows = [{ dma: metro }]; // Placeholder: use city, state for now

      if (format === 'csv') {
        const csv = ['dma', metro].join('\n');

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
