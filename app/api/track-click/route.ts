import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { anonymizeIp } from '@/lib/utils'; // Import anonymizeIp from utils

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      const text = await request.text();
      if (!text || text.trim() === '') {
        console.warn('Track Click: Empty request body received.');
        return NextResponse.json(
          { error: 'Empty request body' },
          { status: 400 }
        );
      }
      body = JSON.parse(text);
    } catch (e) {
      console.error('Track Click: JSON parse error:', e);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const {
      vehicleId,
      dealerId,
      userId,
      sessionId,
      ctaClicked,
      flow,
      utm_source,
      utm_medium,
      utm_campaign,
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
    if (!vehicleId || !dealerId || !userId) {
      console.warn('Track Click: Missing required fields (vehicleId, dealerId, userId). Body:', body);
      return NextResponse.json(
        { error: 'Missing required fields: vehicleId, dealerId, userId' },
        { status: 400 }
      );
    }

    // Validate and normalize flow parameter
    const validFlows = ['direct', 'vdp-only', 'full'];
    const normalizedFlow = validFlows.includes(flow) ? flow : 'full';

    // Check if user has clicked this dealer in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: clickHistory, error: historyError } = await supabaseAdmin
      .from('dealer_click_history')
      .select('*')
      .eq('user_id', userId)
      .eq('dealer_id', dealerId)
      .gte('first_click_at', thirtyDaysAgo.toISOString())
      .single();

    if (historyError && historyError.code !== 'PGRST116') { // PGRST116: No rows found, which is expected for new clicks
      console.error('Track Click: Error fetching click history:', historyError);
      return NextResponse.json({ error: 'Failed to fetch click history' }, { status: 500 });
    }

    // Determine if this click is billable (first time clicking this dealer in 30 days)
    const isBillable = !clickHistory;

    // Log the click event
    const { error: clickError } = await supabaseAdmin.from('clicks').insert({
      vehicle_id: vehicleId,
      dealer_id: dealerId,
      user_id: userId,
      session_id: sessionId || null,
      is_billable: isBillable,
      cta_clicked: ctaClicked || 'primary',
      flow: normalizedFlow,
      user_agent: userAgent,
      ip_address: ipAddress,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      fbclid: fbclid || null,
      gclid: gclid || null,
      ttclid: ttclid || null,
      tblci: tblci || null,
      created_at: new Date().toISOString(),
    });

    if (clickError) {
      // Check if it's a foreign key constraint error (vehicle doesn't exist)
      if (clickError.code === '23503') {
        console.warn('Track Click: Vehicle not found for click. Vehicle ID:', vehicleId);
        return NextResponse.json(
          { error: 'Vehicle not found', billable: false },
          { status: 404 }
        );
      }
      console.error('Track Click: Error logging click:', clickError);
      return NextResponse.json({ error: 'Failed to log click' }, { status: 500 });
    }

    // Update or create dealer click history
    if (clickHistory) {
      // Update existing history (increment count, update last click)
      await supabaseAdmin
        .from('dealer_click_history')
        .update({
          last_click_at: new Date().toISOString(),
          click_count: clickHistory.click_count + 1,
        })
        .eq('id', clickHistory.id);
    } else {
      // Create new history record
      await supabaseAdmin.from('dealer_click_history').insert({
        user_id: userId,
        dealer_id: dealerId,
        first_click_at: new Date().toISOString(),
        last_click_at: new Date().toISOString(),
        click_count: 1,
      });
    }

    // Return billable status and metadata
    return NextResponse.json({
      success: true,
      billable: isBillable,
      message: isBillable
        ? 'Click tracked and billable'
        : 'Click tracked but not billable (duplicate dealer within 30 days)',
      dealerId,
      userId,
    });
  } catch (error) {
    console.error('Track Click: Uncaught error in API:', error);
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
