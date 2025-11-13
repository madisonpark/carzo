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
      const { data: dealers, error } = await supabase
        .from('vehicles')
        .select('latitude, longitude, dealer_name, dealer_id')
        .eq('dealer_city', city)
        .eq('dealer_state', state)
        .eq('is_active', true);

      if (error) throw error;

      if (!dealers || dealers.length === 0) {
        return NextResponse.json(
          { error: `No active dealers found for metro: ${metro}` },
          { status: 404 }
        );
      }

      // Get unique dealer locations
      const uniqueDealers = Array.from(
        new Map(
          dealers.map(d => [
            d.dealer_id,
            {
              latitude: d.latitude,
              longitude: d.longitude,
              dealer_name: d.dealer_name,
            },
          ])
        ).values()
      );

      // Count vehicles per dealer
      const dealerCounts = dealers.reduce((acc: Record<string, number>, d) => {
        acc[d.dealer_id] = (acc[d.dealer_id] || 0) + 1;
        return acc;
      }, {});

      const rows = uniqueDealers.map((dealer: any) => {
        const dealerId = dealers.find(
          d => d.latitude === dealer.latitude && d.longitude === dealer.longitude
        )?.dealer_id;
        const vehicleCount = dealerId ? dealerCounts[dealerId] : 0;

        return {
          latitude: dealer.latitude,
          longitude: dealer.longitude,
          radius_miles: 25,
          dealer_name: dealer.dealer_name,
          vehicle_count: vehicleCount,
        };
      });

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
      const { data: zipCodes, error: zipError } = await supabase.rpc('get_zips_for_metro', {
        p_city: city,
        p_state: state,
        p_radius_miles: 25,
      });

      if (zipError) throw zipError;

      if (!zipCodes || zipCodes.length === 0) {
        return NextResponse.json(
          { error: `No ZIP codes found for metro: ${metro}. This metro may not have active dealers.` },
          { status: 404 }
        );
      }

      const rows = (zipCodes || []).map((z: any) => ({ zip_code: z.zip_code }));

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
  } catch (error: any) {
    console.error('Error exporting targeting:', error);
    return NextResponse.json(
      { error: 'Failed to export targeting', details: error.message },
      { status: 500 }
    );
  }
}
