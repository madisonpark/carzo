-- Migration: Add GIST Spatial Index
-- Purpose: Enable fast spatial queries on location column
-- Performance: Index reduces query time from O(n) to O(log n)
-- Issue: https://github.com/madisonpark/carzo/issues/3

-- Create partial GIST index on location for active vehicles
-- GIST (Generalized Search Tree) is optimized for spatial data
-- This index enables fast ST_DWithin queries (find points within radius)
--
-- OPTIMIZATION: Partial index with WHERE is_active = true
-- - Smaller index (only active vehicles, ~95% of data)
-- - More efficient for query planner (single index vs bitmap scan across two)
-- - Matches common query pattern: WHERE is_active = true AND ST_DWithin(location, ...)
-- - Query planner can use this single, smaller, more specific index
CREATE INDEX IF NOT EXISTS idx_vehicles_active_location_gist
ON vehicles
USING GIST(location)
WHERE is_active = true;

-- Analyze table to update query planner statistics
ANALYZE vehicles;

-- Log index creation
DO $$
DECLARE
  index_size TEXT;
BEGIN
  SELECT pg_size_pretty(pg_relation_size('idx_vehicles_active_location_gist')) INTO index_size;
  RAISE NOTICE 'Partial GIST spatial index created. Size: %', index_size;
END $$;
