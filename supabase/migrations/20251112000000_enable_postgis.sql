-- Migration: Enable PostGIS Extension
-- Purpose: Add spatial query support for location-based vehicle search
-- Performance Impact: Reduces location search from 3-5s to ~50-100ms
-- Issue: https://github.com/madisonpark/carzo/issues/3

-- Enable PostGIS extension (provides spatial/geographic data types and functions)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Verify PostGIS version
DO $$
BEGIN
  RAISE NOTICE 'PostGIS version: %', PostGIS_Version();
END $$;
