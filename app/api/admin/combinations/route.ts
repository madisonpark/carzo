import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAuth } from '@/lib/admin-auth';
import { getCombinations } from '@/lib/admin-data';

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

  try {
    const combinations = await getCombinations();
    return NextResponse.json(combinations);
  } catch (error: unknown) {
    console.error('Error fetching combinations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch combinations', details: errorMessage },
      { status: 500 }
    );
  }
}
