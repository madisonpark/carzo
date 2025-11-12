-- Migration: Create Trigger to Auto-Update location Column
-- Purpose: Automatically populate location GEOGRAPHY from latitude/longitude
-- Issue: https://github.com/madisonpark/carzo/issues/3

-- Create trigger function
CREATE OR REPLACE FUNCTION update_vehicle_location()
RETURNS TRIGGER AS $$
BEGIN
  -- On INSERT or UPDATE, if lat/lon are valid, set location.
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    -- For UPDATE, only re-calculate if lat/lon changed or location was null.
    -- Using IS DISTINCT FROM to handle NULLs correctly.
    IF TG_OP = 'INSERT' OR NEW.latitude IS DISTINCT FROM OLD.latitude OR NEW.longitude IS DISTINCT FROM OLD.longitude OR OLD.location IS NULL THEN
      NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
    END IF;
  -- If lat or lon is NULL, ensure location is also NULL.
  ELSE
    NEW.location = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on vehicles table
DROP TRIGGER IF EXISTS trg_update_vehicle_location ON vehicles;

CREATE TRIGGER trg_update_vehicle_location
  BEFORE INSERT OR UPDATE OF latitude, longitude
  ON vehicles
  FOR EACH ROW
  EXECUTE FUNCTION update_vehicle_location();

-- Add comment
COMMENT ON FUNCTION update_vehicle_location IS 'Auto-populate location GEOGRAPHY column from latitude/longitude on INSERT/UPDATE';

-- Log trigger creation
DO $$
BEGIN
  RAISE NOTICE 'Trigger created: location column will auto-update from lat/lon';
END $$;
