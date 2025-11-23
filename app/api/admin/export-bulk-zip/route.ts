import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import AdmZip from 'adm-zip';
import { validateAdminAuth } from '@/lib/admin-auth';
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
    const results: { name: string; status: 'success' | 'error'; error?: string }[] = [];

    // Process items (sequentially to manage db load)
    for (const item of items) {
      const minVehicles = item.minVehicles || 6;
      const trimmedCampaignValue = item.campaignValue.trim();
      
      try {
        // Build query based on campaign type (Reusing logic from single export)
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
          results.push({ name: trimmedCampaignValue, status: 'error', error: 'No inventory' });
          continue;
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
          results.push({ name: trimmedCampaignValue, status: 'error', error: 'No qualifying metros' });
          continue;
        }

        // Generate CSV content
        const metroLocations = calculateMetroLocations(qualifyingMetros);
        const destinationUrl = generateDestinationUrl(item.campaignType, trimmedCampaignValue);
        const csvContent = generateCsvContent(platform, metroLocations, destinationUrl);

        // Add to ZIP
        const safeName = trimmedCampaignValue.replace(/[^a-z0-9]/gi, '-').toLowerCase();
        const filename = `${platform}-targeting-${safeName}.csv`;
        zip.addFile(filename, Buffer.from(csvContent, 'utf8'));
        
        results.push({ name: trimmedCampaignValue, status: 'success' });

      } catch (error) {
        console.error(`Error processing ${trimmedCampaignValue}:`, error);
        results.push({ 
          name: trimmedCampaignValue, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    if (zip.getEntries().length === 0) {
      return NextResponse.json(
        { error: 'No files were generated. Check inventory levels.', results },
        { status: 404 }
      );
    }

    const zipBuffer = zip.toBuffer();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zipFilename = `${platform}-bulk-export-${timestamp}.zip`;

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
