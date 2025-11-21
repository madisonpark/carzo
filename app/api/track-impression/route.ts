import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anonymizeIp } from '@/lib/utils'; // Import anonymizeIp from utils

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      const text = await request.text();
      if (!text || text.trim() === '') {
        console.warn('Track Impression: Empty request body received.');
        return NextResponse.json(
          { error: 'Empty request body' },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (e) {
      console.error('Track Impression: JSON parse error:', e);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const {
      vehicleId,
      pageType,
      flow,
      userId, // New: from client-side
      sessionId, // New: from client-side
      utm_source,
      utm_medium,
      utm_campaign,
      utm_term,
      utm_content,
      fbclid,
      gclid,
      ttclid,
      tblci,
    } = body;

    // Extract User-Agent and IP
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const ipAddressHeader = request.headers.get('x-forwarded-for');
    let ipAddress: string | null = null;
    if (ipAddressHeader) {
      // x-forwarded-for can contain multiple IPs, the first is usually the client
      ipAddress = ipAddressHeader.split(',')[0].trim();
      ipAddress = anonymizeIp(ipAddress); // Anonymize IP for privacy
    }

    // Validate required fields
    if (!vehicleId || !pageType) {
      console.warn('Track Impression: Missing required fields (vehicleId, pageType). Body:', body);
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
      console.warn('Track Impression: Invalid pageType received. PageType:', pageType);
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
      user_id: userId || null, // New: from client-side
      session_id: sessionId || null, // New: from client-side
      user_agent: userAgent,
      ip_address: ipAddress,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      utm_term: utm_term || null,
      utm_content: utm_content || null,
      fbclid: fbclid || null,
      gclid: gclid || null,
      ttclid: ttclid || null,
      tblci: tblci || null,
      created_at: new Date().toISOString(),
    });

    if (impressionError) {
      // Check if it's a foreign key constraint error (vehicle doesn't exist)
      if (impressionError.code === '23503') {
        console.warn('Track Impression: Vehicle not found for impression. Vehicle ID:', vehicleId);
        return NextResponse.json(
          { error: 'Vehicle not found' },
          { status: 404 }
        );
      }
      console.error('Track Impression: Error logging impression:', impressionError);
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
    console.error('Track Impression: Uncaught error in API:', error);
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
