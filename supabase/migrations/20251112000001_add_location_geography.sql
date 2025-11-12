-- Migration: Add location GEOGRAPHY column
-- Purpose: Store vehicle dealer locations as PostGIS GEOGRAPHY for spatial queries
-- Issue: https://github.com/madisonpark/carzo/issues/3

-- Add GEOGRAPHY column for spatial queries
-- GEOGRAPHY(Point, 4326) = lat/lon coordinates with Earth's curvature calculations
-- SRID 4326 = WGS 84 coordinate system (standard for GPS)
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS location GEOGRAPHY(Point, 4326);

-- Add comment for documentation
COMMENT ON COLUMN vehicles.location IS 'PostGIS GEOGRAPHY point for spatial queries. Auto-populated from latitude/longitude.';

-- Populate location column from existing latitude/longitude data
-- ST_SetSRID + ST_MakePoint creates a geographic point
-- Order: longitude first, then latitude (PostGIS convention)
UPDATE vehicles
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND location IS NULL;

-- Log migration results
DO $$
DECLARE
  total_vehicles INTEGER;
  populated_vehicles INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_vehicles FROM vehicles;
  SELECT COUNT(*) INTO populated_vehicles FROM vehicles WHERE location IS NOT NULL;

  RAISE NOTICE 'Total vehicles: %', total_vehicles;
  RAISE NOTICE 'Vehicles with location: %', populated_vehicles;
  RAISE NOTICE 'Vehicles missing location: %', total_vehicles - populated_vehicles;
END $$;
