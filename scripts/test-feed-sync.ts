/**
 * Test Feed Sync with existing TSV file
 * Uses the TSV from ../lotlinx/feed-data/master269000.tsv
 * Run: npx tsx scripts/test-feed-sync.ts
 */

import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '../.env.local') });

import { createClient } from '@supabase/supabase-js';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

const TSV_PATH = '/Users/steven/dev/lotlinx/feed-data/master269000.tsv';
const TEST_LIMIT = Infinity; // Load ALL vehicles

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

async function main() {
  console.log('🧪 Loading FULL Vehicle Inventory');
  console.log('=========================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Parse TSV
  console.log('📖 Reading TSV file...');
  const vehicles: LotLinxVehicle[] = [];

  const parser = parse({
    delimiter: '\t',
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true, // Allow quotes anywhere in the field
    relax_column_count: true, // Allow inconsistent column counts
    quote: false, // Disable quote processing completely (TSV with messy quotes)
  });

  const stream = createReadStream(TSV_PATH);

  await new Promise<void>((resolve, reject) => {
    stream.pipe(parser)
      .on('data', (row: LotLinxVehicle) => {
        if (vehicles.length < TEST_LIMIT) {
          vehicles.push(row);
        }
      })
      .on('end', () => resolve())
      .on('error', reject);
  });

  console.log(`✅ Parsed ${vehicles.length} vehicles\n`);

  // Show sample
  const sample = vehicles[0];
  console.log('Sample vehicle:');
  console.log(`  VIN: ${sample.Vin}`);
  console.log(`  Vehicle: ${sample.Year} ${sample.Make} ${sample.Model}`);
  console.log(`  Price: $${sample.Price}`);
  console.log(`  Dealer: ${sample.DealerName} (ID: ${sample.DealerId})`);
  console.log('');

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

  // Map to database format - POPULATE ALL FIELDS
  console.log('🔄 Mapping to database format...');
  const dbVehicles = vehicles.map(v => ({
    vin: v.Vin,
    year: parseInt(v.Year) || null,
    make: v.Make || null,
    model: v.Model || null,
    trim: v.Trim || null,
    price: parseFloat(v.Price) || 0,
    miles: parseInt(v.Miles) || null,
    condition: v.Condition || null,
    body_style: v.BodyStyle || null,
    primary_image_url: getFirstImageUrl(v.ImageUrls),
    transmission: v.Transmission || null,
    fuel_type: v.FuelType || null,
    drive_type: v.Drive || null,
    exterior_color: v.ExteriorColor || null,
    interior_color: v.InteriorColor || null,
    mpg_city: null, // Not in feed
    mpg_highway: null, // Not in feed
    doors: parseInt(v.Doors) || null,
    cylinders: parseInt(v.Cylinders) || null,
    description: v.Description || null,
    features: null, // Not in feed
    options: v.Options || null,
    dealer_id: v.DealerId,
    dealer_name: v.DealerName,
    dealer_address: v.Address || null,
    dealer_city: v.City || null,
    dealer_state: v.State || null,
    dealer_zip: v.Zip || null,
    dealer_vdp_url: v.Url,
    total_photos: getTotalPhotos(v.ImageUrls),
    latitude: parseFloat(v.Latitude) || null,
    longitude: parseFloat(v.Longitude) || null,
    targeting_radius: parseInt(v.Radius) || 30,
    is_active: true,
    last_sync: new Date().toISOString(),
  }));

  console.log(`✅ Mapped ${dbVehicles.length} vehicles\n`);

  // Insert to database in batches
  console.log('💾 Inserting to database in batches...');
  const BATCH_SIZE = 1000;
  let inserted = 0;

  for (let i = 0; i < dbVehicles.length; i += BATCH_SIZE) {
    const batch = dbVehicles.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from('vehicles')
      .upsert(batch, {
        onConflict: 'vin',
        ignoreDuplicates: false,
      });

    if (error) {
      console.error(`❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error);
      process.exit(1);
    }

    inserted += batch.length;
    console.log(`  ✓ Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${inserted}/${dbVehicles.length} vehicles`);
  }

  console.log('✅ Successfully inserted all vehicles to database!\n');

  // Verify
  console.log('🔍 Verifying...');
  const { data: count, error: countError } = await supabase
    .from('vehicles')
    .select('count')
    .eq('is_active', true);

  if (!countError) {
    console.log(`✅ Total active vehicles in database: ${JSON.stringify(count)}\n`);
  }

  // Check dealer diversity
  const { data: dealers } = await supabase
    .from('vehicles')
    .select('dealer_id, dealer_name')
    .eq('is_active', true)
    .limit(1000);

  if (dealers) {
    const uniqueDealers = new Set(dealers.map(d => d.dealer_id));
    console.log(`📊 Unique dealers: ${uniqueDealers.size}`);
    console.log(`📊 Total vehicles: ${dealers.length}`);
    console.log(`📊 Diversity ratio: ${(uniqueDealers.size / dealers.length * 100).toFixed(1)}%\n`);
  }

  console.log('✅ Test complete!');
}

main();
