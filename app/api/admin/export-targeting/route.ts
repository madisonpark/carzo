import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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
  // Simple password auth
  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
            r => `${r.latitude},${r.longitude},${r.radius_miles},"${r.dealer_name}",${r.vehicle_count}`
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
      const { data: dealers, error: dealerError } = await supabase
        .from('vehicles')
        .select('latitude, longitude, dealer_id')
        .eq('dealer_city', city)
        .eq('dealer_state', state)
        .eq('is_active', true);

      if (dealerError) throw dealerError;

      // Get unique dealer locations
      const uniqueLocations = Array.from(
        new Set(dealers.map(d => `${d.latitude},${d.longitude}`))
      ).map(loc => {
        const [lat, lon] = loc.split(',').map(Number);
        return { latitude: lat, longitude: lon };
      });

      // Find ZIP codes within 25 miles of ANY dealer
      // Using ST_DWithin with 25 miles = 40234 meters
      const zipCodes = new Set<string>();

      for (const location of uniqueLocations) {
        const { data: nearbyZips, error: zipError } = await supabase.rpc('get_nearby_zips', {
          p_latitude: location.latitude,
          p_longitude: location.longitude,
          p_radius_miles: 25,
        });

        if (!zipError && nearbyZips) {
          nearbyZips.forEach((z: any) => zipCodes.add(z.zip_code));
        }
      }

      const rows = Array.from(zipCodes).map(zip => ({ zip_code: zip }));

      if (format === 'csv') {
        const csv = ['zip_code', ...rows.map(r => r.zip_code)].join('\n');

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
