import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import AdmZip from 'adm-zip';
import { validateAdminAuth } from '@/lib/admin-auth';
import { checkMultipleRateLimits, getClientIdentifier } from '@/lib/rate-limit';
import {
  calculateMetroLocations,
  generateDestinationUrl,
  generateCsvContent,
  CampaignType,
  Platform,
  Vehicle,
} from '@/lib/campaign-export';

export const dynamic = 'force-dynamic';

interface BulkExportItem {
  campaignType: CampaignType;
  campaignValue: string;
  minVehicles?: number;
}

interface BulkExportRequest {
  platform: Platform;
  items: BulkExportItem[];
  maxMetros?: number;
}

export async function POST(request: NextRequest) {
  // Validate auth
  const authResult = await validateAdminAuth(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  // Rate Limiting
  const identifier = getClientIdentifier(request);
  const BULK_EXPORT_LIMIT = { limit: 20, windowSeconds: 60 };
  
  const rateLimitResult = await checkMultipleRateLimits(identifier, [
    { endpoint: 'admin_bulk_export', ...BULK_EXPORT_LIMIT },
  ]);
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': rateLimitResult.limit.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
        },
      }
    );
  }

  try {
    const body: BulkExportRequest = await request.json();
    const { platform, items, maxMetros = 100 } = body;

    if (!platform || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request body. Required: platform, items[]' },
        { status: 400 }
      );
    }

    // Limit batch size to prevent timeouts (Vercel function limit is 10-60s)
    const MAX_BATCH_SIZE = 20;
    if (items.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Batch size limit exceeded. Max ${MAX_BATCH_SIZE} items per request.` },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create ZIP
    const zip = new AdmZip();
    
    // Process items in parallel to avoid timeouts
    const results = await Promise.all(items.map(async (item) => {
      const minVehicles = item.minVehicles || 6;
      const trimmedCampaignValue = item.campaignValue.trim();
      
      try {
        // Build query based on campaign type
        let query = supabase.from('vehicles').select('*').eq('is_active', true);

        if (item.campaignType === 'body_style') {
          query = query.eq('body_style', trimmedCampaignValue);
        } else if (item.campaignType === 'make') {
          query = query.eq('make', trimmedCampaignValue);
        } else if (item.campaignType === 'make_body_style') {
          const parts = trimmedCampaignValue.split(' ');
          if (parts.length < 2) throw new Error('Invalid make_body_style format');
          query = query.eq('make', parts[0]).eq('body_style', parts.slice(1).join(' '));
        } else if (item.campaignType === 'make_model') {
          const parts = trimmedCampaignValue.split(' ');
          if (parts.length < 2) throw new Error('Invalid make_model format');
          query = query.eq('make', parts[0]).eq('model', parts.slice(1).join(' '));
        }

        const { data: vehiclesData, error } = await query;
        if (error) throw error;

        const vehicles: Vehicle[] = vehiclesData || [];

        if (vehicles.length === 0) {
          return { name: trimmedCampaignValue, status: 'error', error: 'No inventory found (0 vehicles)' } as const;
        }

        // Group and Filter Metros
        const metroMap = new Map<string, Vehicle[]>();
        for (const vehicle of vehicles) {
          const metro = vehicle.dma || `${vehicle.dealer_city}, ${vehicle.dealer_state}`;
          if (!metroMap.has(metro)) metroMap.set(metro, []);
          metroMap.get(metro)!.push(vehicle);
        }

        const qualifyingMetros = Array.from(metroMap.entries())
          .filter(([, v]) => v.length >= minVehicles)
          .sort(([, a], [, b]) => b.length - a.length)
          .slice(0, maxMetros);

        if (qualifyingMetros.length === 0) {
          return { name: trimmedCampaignValue, status: 'error', error: `Found ${vehicles.length} vehicles but no metros with ${minVehicles}+ vehicles` } as const;
        }

        // Generate CSV content
        const metroLocations = calculateMetroLocations(qualifyingMetros);
        const destinationUrl = generateDestinationUrl(item.campaignType, trimmedCampaignValue);
        const csvContent = generateCsvContent(platform, metroLocations, destinationUrl);

        return { 
          name: trimmedCampaignValue, 
          status: 'success', 
          filename: `${platform}-targeting-${trimmedCampaignValue.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.csv`,
          content: csvContent 
        } as const;

      } catch (error) {
        console.error(`Error processing ${trimmedCampaignValue}:`, error);
        return { 
          name: trimmedCampaignValue, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        } as const;
      }
    }));

    // Add successful results to ZIP
    results.forEach(result => {
      if (result.status === 'success') {
        zip.addFile(result.filename, Buffer.from(result.content, 'utf8'));
      }
    });

    if (zip.getEntries().length === 0) {
      return NextResponse.json(
        { error: 'No files were generated. Check inventory levels.', results },
        { status: 404 }
      );
    }

    const zipBuffer = zip.toBuffer();
    // Format: YYYY_MM_DD_HH-MM-SS to match frontend helper
    const now = new Date();
    const pad = (num: number) => num.toString().padStart(2, '0');
    const timestamp = `${now.getFullYear()}_${pad(now.getMonth() + 1)}_${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}-${pad(now.getSeconds())}`;
    
    const zipFilename = `${platform}_bulk_export_${timestamp}.zip`;

    return new NextResponse(zipBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'X-Export-Results': JSON.stringify(results) // Pass metadata about success/fail
      },
    });

  } catch (error) {
    console.error('Bulk export error:', error);
    return NextResponse.json(
      { error: 'Failed to process bulk export' },
      { status: 500 }
    );
  }
}
