import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      const text = await request.text();
      if (!text || text.trim() === '') {
        return NextResponse.json(
          { error: 'Empty request body' },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error:', e);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { vehicleId, pageType, flow } = body;

    // Validate required fields
    if (!vehicleId || !pageType) {
      return NextResponse.json(
        { error: 'Missing required fields: vehicleId, pageType' },
        { status: 400 }
      );
    }

    // Validate and normalize flow parameter
    const validFlows = ['direct', 'vdp-only', 'full'];
    const normalizedFlow = validFlows.includes(flow) ? flow : 'full';

    // Validate page type
    const validPageTypes = ['search', 'homepage', 'vdp'];
    if (!validPageTypes.includes(pageType)) {
      return NextResponse.json(
        { error: 'Invalid pageType. Must be: search, homepage, or vdp' },
        { status: 400 }
      );
    }

    // Log the impression
    const { error: impressionError } = await supabaseAdmin.from('impressions').insert({
      vehicle_id: vehicleId,
      page_type: pageType,
      flow: normalizedFlow,
      created_at: new Date().toISOString(),
    });

    if (impressionError) {
      // Check if it's a foreign key constraint error (vehicle doesn't exist)
      if (impressionError.code === '23503') {
        return NextResponse.json(
          { error: 'Vehicle not found' },
          { status: 404 }
        );
      }
      console.error('Error logging impression:', impressionError);
      return NextResponse.json({ error: 'Failed to log impression' }, { status: 500 });
    }

    // Return success
    return NextResponse.json({
      success: true,
      message: 'Impression tracked successfully',
      vehicleId,
      pageType,
      flow: normalizedFlow,
    });
  } catch (error) {
    console.error('Error in track-impression API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Allow CORS for client-side requests
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
