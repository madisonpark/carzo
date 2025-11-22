import { NextRequest, NextResponse } from 'next/server';
import { validateAdminAuth } from '@/lib/admin-auth';
import { getCachedInventorySnapshot } from '@/lib/admin-data';

export const dynamic = 'force-dynamic';

/**
 * Get high-level inventory snapshot
 * Quick reference numbers for ad copy writing
 *
 * @returns Total counts by metro, body style, and make
 */
export async function GET(request: NextRequest) {
  // Validate auth and rate limiting
  const authResult = await validateAdminAuth(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const snapshot = await getCachedInventorySnapshot();
    return NextResponse.json(snapshot);
  } catch (error: unknown) {
    console.error('Error fetching inventory snapshot:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch inventory snapshot', details: errorMessage },
      { status: 500 }
    );
  }
}
