-- Migration: Add GIST Spatial Index
-- Purpose: Enable fast spatial queries on location column
-- Performance: Index reduces query time from O(n) to O(log n)
-- Issue: https://github.com/madisonpark/carzo/issues/3

-- Create GIST index on location column
-- GIST (Generalized Search Tree) is optimized for spatial data
-- This index enables fast ST_DWithin queries (find points within radius)
CREATE INDEX IF NOT EXISTS idx_vehicles_location_gist
ON vehicles
USING GIST(location);

-- Add index on is_active for combined queries
-- Most queries will be: WHERE is_active = true AND ST_DWithin(location, ...)
CREATE INDEX IF NOT EXISTS idx_vehicles_active_location
ON vehicles(is_active)
WHERE is_active = true;

-- Analyze table to update query planner statistics
ANALYZE vehicles;

-- Log index creation
DO $$
DECLARE
  index_size TEXT;
BEGIN
  SELECT pg_size_pretty(pg_relation_size('idx_vehicles_location_gist')) INTO index_size;
  RAISE NOTICE 'Spatial index created. Size: %', index_size;
END $$;
