-- ============================================================================
-- Apply Flow Column Migrations
-- Purpose: Add 'flow' column to clicks and impressions tables for A/B testing
-- Date: 2025-11-12
--
-- Instructions:
-- 1. Go to your Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select the "Carzo" project (bjduvewfpounusjqkbjx)
-- 3. Navigate to SQL Editor
-- 4. Copy and paste this entire file
-- 5. Click "Run" to execute
--
-- This SQL is idempotent - safe to run multiple times
-- ============================================================================

-- Add flow column to clicks table
DO $$
BEGIN
  -- Check if column already exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'clicks'
      AND column_name = 'flow'
  ) THEN
    -- Add the column
    ALTER TABLE clicks ADD COLUMN flow VARCHAR(20) DEFAULT 'full';
    RAISE NOTICE 'Added flow column to clicks table';
  ELSE
    RAISE NOTICE 'Flow column already exists in clicks table';
  END IF;
END $$;

-- Create index on clicks.flow
DO $$
BEGIN
  -- Check if index already exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'clicks'
      AND indexname = 'idx_clicks_flow'
  ) THEN
    -- Create the index
    CREATE INDEX idx_clicks_flow ON clicks(flow);
    RAISE NOTICE 'Created index idx_clicks_flow';
  ELSE
    RAISE NOTICE 'Index idx_clicks_flow already exists';
  END IF;
END $$;

-- Add comment to clicks.flow column
COMMENT ON COLUMN clicks.flow IS 'A/B test flow variant: direct (SERP→Dealer), vdp-only (VDP→Dealer), full (SERP→VDP→Dealer, default)';

-- Add flow column to impressions table
DO $$
BEGIN
  -- Check if column already exists
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'impressions'
      AND column_name = 'flow'
  ) THEN
    -- Add the column
    ALTER TABLE impressions ADD COLUMN flow VARCHAR(20) DEFAULT 'full';
    RAISE NOTICE 'Added flow column to impressions table';
  ELSE
    RAISE NOTICE 'Flow column already exists in impressions table';
  END IF;
END $$;

-- Create index on impressions.flow
DO $$
BEGIN
  -- Check if index already exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'impressions'
      AND indexname = 'idx_impressions_flow'
  ) THEN
    -- Create the index
    CREATE INDEX idx_impressions_flow ON impressions(flow);
    RAISE NOTICE 'Created index idx_impressions_flow';
  ELSE
    RAISE NOTICE 'Index idx_impressions_flow already exists';
  END IF;
END $$;

-- Add comment to impressions.flow column
COMMENT ON COLUMN impressions.flow IS 'A/B test flow variant: direct (SERP→Dealer), vdp-only (VDP→Dealer), full (SERP→VDP→Dealer, default)';

-- ============================================================================
-- Verification Queries
-- ============================================================================

-- Verify clicks table structure
SELECT
  column_name,
  data_type,
  character_maximum_length,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'clicks'
  AND column_name = 'flow';

-- Verify impressions table structure
SELECT
  column_name,
  data_type,
  character_maximum_length,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'impressions'
  AND column_name = 'flow';

-- Verify indexes were created
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN ('idx_clicks_flow', 'idx_impressions_flow')
ORDER BY tablename, indexname;

-- Show sample data (should all have 'full' as default)
SELECT 'clicks' as table_name, flow, COUNT(*) as count
FROM clicks
GROUP BY flow
UNION ALL
SELECT 'impressions' as table_name, flow, COUNT(*) as count
FROM impressions
GROUP BY flow;
