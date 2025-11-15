import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateAdminAuth } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

/**
 * Get make+bodystyle and make+model combinations
 *
 * @returns Top combinations for campaign planning
 */
export async function GET(request: NextRequest) {
  // Validate auth and rate limiting
  const authResult = await validateAdminAuth(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const [makeBodyStyleResult, makeModelResult] = await Promise.all([
      supabase.rpc('get_make_bodystyle_combos'),
      supabase.rpc('get_make_model_combos'),
    ]);

    if (makeBodyStyleResult.error) throw makeBodyStyleResult.error;
    if (makeModelResult.error) throw makeModelResult.error;

    return NextResponse.json({
      make_bodystyle: makeBodyStyleResult.data || [],
      make_model: makeModelResult.data || [],
    });
  } catch (error: any) {
    console.error('Error fetching combinations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch combinations', details: error.message },
      { status: 500 }
    );
  }
}
