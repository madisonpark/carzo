/**
 * LotLinx Feed Sync
 * Downloads, parses, and syncs vehicle data from LotLinx Publisher Feed
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import * as zlib from 'zlib';
import { pipeline } from 'stream/promises';
import { createReadStream, createWriteStream } from 'fs';
import { parse } from 'csv-parse';

// Feed field mapping (34 fields from LotLinx TSV)
// Column names are capitalized in the feed
interface LotLinxVehicle {
  Vin: string;
  Year: string;
  Make: string;
  Model: string;
  Trim: string;
  Price: string;
  Miles: string;
  Condition: string;
  BodyStyle: string;
  ImageUrls: string; // Comma-separated image URLs
  Transmission: string;
  FuelType: string;
  Drive: string;
  ExteriorColor: string;
  InteriorColor: string;
  Doors: string;
  Cylinders: string;
  Description: string;
  Options: string;
  DealerId: string;
  DealerName: string;
  Address: string;
  City: string;
  State: string;
  Zip: string;
  Url: string; // Dealer VDP URL
  Certified: string;
  Latitude: string;
  Longitude: string;
  Dma: string;
  Radius: string;
  Payout: string;
  Priority: string;
  Dol: string;
}

interface FeedSyncResult {
  success: boolean;
  added: number;
  updated: number;
  removed: number;
  errors: string[];
  duration: number;
}

export class FeedSyncService {
  private supabase;
  private feedUrl: string;
  private username: string;
  private password: string;
  private publisherId: string;

  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    feedUsername: string,
    feedPassword: string,
    publisherId: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.username = feedUsername;
    this.password = feedPassword;
    this.publisherId = publisherId;
    this.feedUrl = `https://feed.lotlinx.com/${publisherId}.zip`;
  }

  /**
   * Main sync process
   */
  async syncFeed(): Promise<FeedSyncResult> {
    const startTime = Date.now();
    const result: FeedSyncResult = {
      success: false,
      added: 0,
      updated: 0,
      removed: 0,
      errors: [],
      duration: 0,
    };

    try {
      console.log('🚀 Starting feed sync...');

      // Step 1: Download feed
      console.log('📥 Downloading feed...');
      const zipPath = await this.downloadFeed();
      console.log(`✅ Downloaded: ${zipPath}`);

      // Step 2: Extract TSV
      console.log('📦 Extracting TSV...');
      const tsvPath = await this.extractTSV(zipPath);
      console.log(`✅ Extracted: ${tsvPath}`);

      // Step 3: Parse vehicles
      console.log('🔍 Parsing vehicles...');
      const vehicles = await this.parseTSV(tsvPath);
      console.log(`✅ Parsed ${vehicles.length} vehicles`);

      // Step 4: Sync to database
      console.log('💾 Syncing to database...');
      const syncResult = await this.syncToDatabase(vehicles);
      result.added = syncResult.added;
      result.updated = syncResult.updated;
      result.removed = syncResult.removed;

      // Step 5: Cleanup temp files
      fs.unlinkSync(zipPath);
      fs.unlinkSync(tsvPath);

      result.success = true;
      result.duration = Date.now() - startTime;

      console.log('✨ Feed sync complete!');
      console.log(`   Added: ${result.added}`);
      console.log(`   Updated: ${result.updated}`);
      console.log(`   Removed: ${result.removed}`);
      console.log(`   Duration: ${(result.duration / 1000).toFixed(2)}s`);

      // Log sync to database
      await this.logSync(result);

      return result;
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : String(error));
      result.duration = Date.now() - startTime;
      console.error('❌ Feed sync failed:', error);

      // Log failed sync
      await this.logSync(result);

      return result;
    }
  }

  /**
   * Download feed ZIP from LotLinx
   */
  private async downloadFeed(): Promise<string> {
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const zipPath = path.join(tempDir, `feed-${Date.now()}.zip`);
    const auth = Buffer.from(`${this.username}:${this.password}`).toString('base64');

    return new Promise((resolve, reject) => {
      const options = {
        headers: {
          'Authorization': `Basic ${auth}`,
        },
      };

      https.get(this.feedUrl, options, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const file = createWriteStream(zipPath);
        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve(zipPath);
        });

        file.on('error', (err) => {
          fs.unlinkSync(zipPath);
          reject(err);
        });
      }).on('error', reject);
    });
  }

  /**
   * Extract TSV from ZIP
   */
  private async extractTSV(zipPath: string): Promise<string> {
    const tsvPath = zipPath.replace('.zip', '.tsv');

    // Use unzip command (macOS/Linux)
    const { execSync } = require('child_process');
    const tempDir = path.dirname(zipPath);

    // Extract to temp directory
    execSync(`unzip -o "${zipPath}" -d "${tempDir}"`);

    // Find the TSV file
    const files = fs.readdirSync(tempDir);
    const tsvFile = files.find(f => f.endsWith('.tsv'));

    if (!tsvFile) {
      throw new Error('No TSV file found in ZIP');
    }

    const extractedPath = path.join(tempDir, tsvFile);

    // Rename to standard name
    if (extractedPath !== tsvPath) {
      fs.renameSync(extractedPath, tsvPath);
    }

    return tsvPath;
  }

  /**
   * Parse TSV file into vehicle objects
   */
  private async parseTSV(tsvPath: string): Promise<LotLinxVehicle[]> {
    const vehicles: LotLinxVehicle[] = [];

    return new Promise((resolve, reject) => {
      const parser = parse({
        delimiter: '\t',
        columns: true,
        skip_empty_lines: true,
        trim: true,
        relax_quotes: true,
        relax_column_count: true,
        quote: false, // Disable quote processing (TSV with messy quotes)
      });

      const stream = createReadStream(tsvPath);

      stream.pipe(parser)
        .on('data', (row) => {
          vehicles.push(row as LotLinxVehicle);
        })
        .on('end', () => {
          resolve(vehicles);
        })
        .on('error', reject);
    });
  }

  /**
   * Sync vehicles to Supabase (upsert in batches)
   */
  private async syncToDatabase(vehicles: LotLinxVehicle[]): Promise<{
    added: number;
    updated: number;
    removed: number;
  }> {
    const BATCH_SIZE = 1000;
    let added = 0;
    let updated = 0;

    // Get all current VINs to track removals
    const { data: currentVehicles } = await this.supabase
      .from('vehicles')
      .select('vin, id')
      .eq('is_active', true);

    const currentVins = new Set(currentVehicles?.map(v => v.vin) || []);
    const feedVins = new Set(vehicles.map(v => v.Vin));

    // Process in batches
    for (let i = 0; i < vehicles.length; i += BATCH_SIZE) {
      const batch = vehicles.slice(i, i + BATCH_SIZE);

      const dbVehicles = batch.map(v => this.mapVehicleToDb(v));

      const { error } = await this.supabase
        .from('vehicles')
        .upsert(dbVehicles, {
          onConflict: 'vin',
          ignoreDuplicates: false,
        });

      if (error) {
        console.error('Batch upsert error:', error);
        throw error;
      }

      // Count new vs updated (rough estimate based on existence)
      for (const vehicle of batch) {
        if (currentVins.has(vehicle.Vin)) {
          updated++;
        } else {
          added++;
        }
      }

      console.log(`   Synced ${Math.min(i + BATCH_SIZE, vehicles.length)}/${vehicles.length}`);
    }

    // Mark removed vehicles as inactive
    const removedVins = Array.from(currentVins).filter(vin => !feedVins.has(vin));

    if (removedVins.length > 0) {
      await this.supabase
        .from('vehicles')
        .update({ is_active: false })
        .in('vin', removedVins);
    }

    return {
      added,
      updated,
      removed: removedVins.length,
    };
  }

  /**
   * Map LotLinx vehicle to database schema
   */
  private mapVehicleToDb(vehicle: LotLinxVehicle): any {
    // Extract primary image URL from ImageUrls (comma-separated)
    const getFirstImageUrl = (imageUrls: string): string => {
      if (!imageUrls) return '';
      const urls = imageUrls.split(',');
      return urls[0]?.trim() || '';
    };

    // Count total photos
    const getTotalPhotos = (imageUrls: string): number => {
      if (!imageUrls) return 0;
      const urls = imageUrls.split(',').filter(u => u.trim());
      return urls.length;
    };

    return {
      vin: vehicle.Vin,
      year: parseInt(vehicle.Year) || null,
      make: vehicle.Make || null,
      model: vehicle.Model || null,
      trim: vehicle.Trim || null,
      price: parseFloat(vehicle.Price) || 0,
      miles: parseInt(vehicle.Miles) || null,
      condition: vehicle.Condition || null,
      body_style: vehicle.BodyStyle || null,
      primary_image_url: getFirstImageUrl(vehicle.ImageUrls),
      transmission: vehicle.Transmission || null,
      fuel_type: vehicle.FuelType || null,
      drive_type: vehicle.Drive || null,
      exterior_color: vehicle.ExteriorColor || null,
      interior_color: vehicle.InteriorColor || null,
      mpg_city: null, // Not in feed
      mpg_highway: null, // Not in feed
      doors: parseInt(vehicle.Doors) || null,
      cylinders: parseInt(vehicle.Cylinders) || null,
      description: vehicle.Description || null,
      features: null, // Not in feed
      options: vehicle.Options || null,
      dealer_id: vehicle.DealerId,
      dealer_name: vehicle.DealerName,
      dealer_address: vehicle.Address || null,
      dealer_city: vehicle.City || null,
      dealer_state: vehicle.State || null,
      dealer_zip: vehicle.Zip || null,
      dealer_vdp_url: vehicle.Url,
      total_photos: getTotalPhotos(vehicle.ImageUrls),
      latitude: parseFloat(vehicle.Latitude) || null,
      longitude: parseFloat(vehicle.Longitude) || null,
      targeting_radius: parseInt(vehicle.Radius) || 30,
      is_active: true,
      last_sync: new Date().toISOString(),
    };
  }

  /**
   * Log sync results to database
   */
  private async logSync(result: FeedSyncResult): Promise<void> {
    try {
      await this.supabase.from('feed_sync_logs').insert({
        sync_started_at: new Date(Date.now() - result.duration).toISOString(),
        sync_completed_at: new Date().toISOString(),
        vehicles_added: result.added,
        vehicles_updated: result.updated,
        vehicles_removed: result.removed,
        success: result.success,
        error_message: result.errors.length > 0 ? result.errors.join('; ') : null,
        duration_seconds: Math.round(result.duration / 1000),
      });
    } catch (error) {
      console.error('Failed to log sync:', error);
    }
  }
}
