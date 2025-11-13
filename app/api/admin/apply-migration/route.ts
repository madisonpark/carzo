import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

/**
 * Temporary admin endpoint to apply migrations directly
 * Used when CLI migration tracking is out of sync
 */
export async function POST(request: NextRequest) {
  // Check admin password
  const authHeader = request.headers.get('authorization');
  if (!authHeader || authHeader !== `Bearer ${process.env.ADMIN_PASSWORD}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Read the migration SQL
    const migrationPath = join(
      process.cwd(),
      'supabase/migrations/20251113095725_add_us_zip_codes_table.sql'
    );
    const sql = readFileSync(migrationPath, 'utf-8');

    // Execute the SQL - split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('COMMENT'));

    for (const statement of statements) {
      // Execute via supabase-js (uses PostgREST)
      // Note: This may not work for DDL, so we'll try rpc approach
      const { error } = await supabase.rpc('exec', { sql: statement + ';' });

      if (error) {
        throw new Error(`SQL execution failed: ${error.message}`);
      }
    }

    // Verify table was created
    const { data, error: checkError } = await supabase
      .from('us_zip_codes')
      .select('count')
      .limit(1);

    return NextResponse.json({
      success: !checkError,
      message: checkError
        ? `Migration applied but verification failed: ${checkError.message}`
        : 'Migration applied successfully',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        suggestion: 'You may need to run this SQL manually in Supabase dashboard SQL editor',
      },
      { status: 500 }
    );
  }
}
