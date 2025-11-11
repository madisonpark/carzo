import { NextRequest, NextResponse } from 'next/server';
import zipcodes from 'zipcodes';

/**
 * API endpoint to convert zip code to coordinates
 * Uses the zipcodes npm package for US zip code lookups
 */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const zipCode = searchParams.get('zip');

    if (!zipCode) {
      return NextResponse.json(
        { error: 'Zip code is required' },
        { status: 400 }
      );
    }

    // Clean zip code (remove any non-digits)
    const cleanZip = zipCode.replace(/\D/g, '').slice(0, 5);

    if (cleanZip.length !== 5) {
      return NextResponse.json(
        { error: 'Invalid zip code format' },
        { status: 400 }
      );
    }

    // Look up zip code
    const zipData = zipcodes.lookup(cleanZip);

    if (!zipData) {
      return NextResponse.json(
        {
          error: 'Zip code not found',
          message: 'Please enter a valid US zip code'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      location: {
        city: zipData.city,
        state: zipData.state,
        latitude: zipData.latitude,
        longitude: zipData.longitude,
        zipCode: cleanZip,
      },
    });
  } catch (error) {
    console.error('Error looking up zip code:', error);
    return NextResponse.json(
      {
        error: 'Failed to lookup zip code',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
