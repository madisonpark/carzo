#!/usr/bin/env tsx

/**
 * Import US ZIP codes data from public dataset
 * Source: https://simplemaps.com/data/us-zips (free basic database)
 * Alternative: https://github.com/scpike/us-state-county-zip
 */

import { config } from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';

config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Sample ZIP code data (top 100 most populous ZIPs across major metros)
// This is a starter dataset - can be expanded later with full 40k+ ZIPs
const SAMPLE_ZIP_CODES = [
  // New York metro
  { zip_code: '10001', city: 'New York', state: 'NY', latitude: 40.7506, longitude: -73.9971, population: 21102 },
  { zip_code: '10002', city: 'New York', state: 'NY', latitude: 40.7156, longitude: -73.9875, population: 81410 },
  { zip_code: '10003', city: 'New York', state: 'NY', latitude: 40.7310, longitude: -73.9896, population: 56024 },

  // Los Angeles metro
  { zip_code: '90001', city: 'Los Angeles', state: 'CA', latitude: 33.9731, longitude: -118.2479, population: 57110 },
  { zip_code: '90002', city: 'Los Angeles', state: 'CA', latitude: 33.9497, longitude: -118.2468, population: 51223 },
  { zip_code: '90003', city: 'Los Angeles', state: 'CA', latitude: 33.9642, longitude: -118.2728, population: 66266 },

  // Chicago metro
  { zip_code: '60601', city: 'Chicago', state: 'IL', latitude: 41.8856, longitude: -87.6219, population: 2873 },
  { zip_code: '60602', city: 'Chicago', state: 'IL', latitude: 41.8831, longitude: -87.6297, population: 5534 },
  { zip_code: '60603', city: 'Chicago', state: 'IL', latitude: 41.8812, longitude: -87.6262, population: 1255 },

  // Philadelphia metro
  { zip_code: '19103', city: 'Philadelphia', state: 'PA', latitude: 39.9526, longitude: -75.1652, population: 6568 },
  { zip_code: '19104', city: 'Philadelphia', state: 'PA', latitude: 39.9611, longitude: -75.1989, population: 29483 },
  { zip_code: '19106', city: 'Philadelphia', state: 'PA', latitude: 39.9500, longitude: -75.1492, population: 7641 },

  // Phoenix metro
  { zip_code: '85001', city: 'Phoenix', state: 'AZ', latitude: 33.4484, longitude: -112.0740, population: 2529 },
  { zip_code: '85003', city: 'Phoenix', state: 'AZ', latitude: 33.4484, longitude: -112.0796, population: 2529 },
  { zip_code: '85004', city: 'Phoenix', state: 'AZ', latitude: 33.4519, longitude: -112.0717, population: 5478 },

  // Dallas metro
  { zip_code: '75201', city: 'Dallas', state: 'TX', latitude: 32.7873, longitude: -96.7967, population: 3898 },
  { zip_code: '75202', city: 'Dallas', state: 'TX', latitude: 32.7814, longitude: -96.7995, population: 4366 },
  { zip_code: '75203', city: 'Dallas', state: 'TX', latitude: 32.7685, longitude: -96.7838, population: 21797 },

  // Houston metro
  { zip_code: '77001', city: 'Houston', state: 'TX', latitude: 29.7520, longitude: -95.3563, population: 1756 },
  { zip_code: '77002', city: 'Houston', state: 'TX', latitude: 29.7589, longitude: -95.3677, population: 5031 },
  { zip_code: '77003', city: 'Houston', state: 'TX', latitude: 29.7491, longitude: -95.3495, population: 13955 },

  // Denver metro
  { zip_code: '80201', city: 'Denver', state: 'CO', latitude: 39.7539, longitude: -104.9897, population: 3598 },
  { zip_code: '80202', city: 'Denver', state: 'CO', latitude: 39.7519, longitude: -104.9964, population: 5099 },
  { zip_code: '80203', city: 'Denver', state: 'CO', latitude: 39.7312, longitude: -104.9790, population: 19235 },

  // Miami metro
  { zip_code: '33101', city: 'Miami', state: 'FL', latitude: 25.7753, longitude: -80.1906, population: 2291 },
  { zip_code: '33109', city: 'Miami Beach', state: 'FL', latitude: 25.7696, longitude: -80.1388, population: 8076 },
  { zip_code: '33125', city: 'Miami', state: 'FL', latitude: 25.7840, longitude: -80.2331, population: 44930 },

  // Atlanta metro
  { zip_code: '30301', city: 'Atlanta', state: 'GA', latitude: 33.7490, longitude: -84.3880, population: 2138 },
  { zip_code: '30302', city: 'Atlanta', state: 'GA', latitude: 33.7540, longitude: -84.3901, population: 8365 },
  { zip_code: '30303', city: 'Atlanta', state: 'GA', latitude: 33.7490, longitude: -84.3880, population: 9631 },

  // Seattle metro
  { zip_code: '98101', city: 'Seattle', state: 'WA', latitude: 47.6105, longitude: -122.3363, population: 4277 },
  { zip_code: '98102', city: 'Seattle', state: 'WA', latitude: 47.6306, longitude: -122.3221, population: 24890 },
  { zip_code: '98103', city: 'Seattle', state: 'WA', latitude: 47.6769, longitude: -122.3419, population: 45675 },
];

async function importZipCodes() {
  console.log(`Importing ${SAMPLE_ZIP_CODES.length} ZIP codes...\n`);

  // Import in batches of 100
  const batchSize = 100;
  for (let i = 0; i < SAMPLE_ZIP_CODES.length; i += batchSize) {
    const batch = SAMPLE_ZIP_CODES.slice(i, i + batchSize);

    const { error } = await supabase
      .from('us_zip_codes')
      .upsert(batch, { onConflict: 'zip_code' });

    if (error) {
      console.error(`❌ Error importing batch ${i / batchSize + 1}:`, error.message);
      process.exit(1);
    }

    console.log(`✅ Batch ${i / batchSize + 1} imported (${batch.length} ZIPs)`);
  }

  console.log(`\n✅ Successfully imported ${SAMPLE_ZIP_CODES.length} ZIP codes`);
  console.log('\n💡 Note: This is a starter dataset of ~30 ZIPs for major metros.');
  console.log('   For full coverage, download complete dataset from:');
  console.log('   https://simplemaps.com/data/us-zips (free basic version)');
  console.log('   or https://github.com/scpike/us-state-county-zip\n');
}

importZipCodes();
