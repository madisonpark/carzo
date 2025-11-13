#!/usr/bin/env tsx

/**
 * Import all US ZIP codes from data/zip-city-st-lat-long.csv
 */

import { config } from 'dotenv';
import { join } from 'path';
import { createClient } from '@supabase/supabase-js';
import { createReadStream } from 'fs';
import { parse } from 'csv-parse';

config({ path: join(__dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function importZipCodes() {
  const csvPath = join(__dirname, '../data/zip-city-st-lat-long.csv');
  const parser = createReadStream(csvPath).pipe(parse({ columns: true, skip_empty_lines: true }));

  let batch: any[] = [];
  const batchSize = 500;
  let totalImported = 0;
  let batchNumber = 1;

  console.log('Importing ZIP codes from CSV...\n');

  for await (const row of parser) {
    batch.push({
      zip_code: row.zipCode,
      city: row.city,
      state: row.state,
      latitude: parseFloat(row.latitude),
      longitude: parseFloat(row.longitude),
      population: null, // Not in this dataset
    });

    if (batch.length >= batchSize) {
      const { error } = await supabase
        .from('us_zip_codes')
        .upsert(batch, { onConflict: 'zip_code' });

      if (error) {
        console.error(`❌ Error importing batch ${batchNumber}:`, error.message);
        process.exit(1);
      }

      totalImported += batch.length;
      console.log(`✅ Batch ${batchNumber} imported (${batch.length} ZIPs) - Total: ${totalImported}`);

      batch = [];
      batchNumber++;
    }
  }

  // Import remaining
  if (batch.length > 0) {
    const { error } = await supabase
      .from('us_zip_codes')
      .upsert(batch, { onConflict: 'zip_code' });

    if (error) {
      console.error(`❌ Error importing final batch:`, error.message);
      process.exit(1);
    }

    totalImported += batch.length;
    console.log(`✅ Final batch imported (${batch.length} ZIPs) - Total: ${totalImported}`);
  }

  console.log(`\n✅ Successfully imported ${totalImported} ZIP codes!`);
}

importZipCodes();
