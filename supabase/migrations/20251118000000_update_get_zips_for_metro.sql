-- Update get_zips_for_metro to support inventory filtering
-- This allows targeting only areas near dealers that have specific inventory
--
-- Migration Strategy: Function overloading for zero-downtime deployment
-- 1. Create new function signature with optional inventory filters
-- 2. Keep old 3-parameter signature as wrapper (calls new function with NULLs)
-- 3. Existing code continues to work during deployment
-- 4. Future migration can drop old signature after code is updated

-- Create new function signature with inventory filtering
CREATE OR REPLACE FUNCTION get_zips_for_metro(
  p_city TEXT,
  p_state TEXT,
  p_radius_miles INT DEFAULT 25,
  p_make TEXT DEFAULT NULL,
  p_body_style TEXT DEFAULT NULL
)
RETURNS TABLE (
  zip_code VARCHAR(5)
) AS $$
BEGIN
  RETURN QUERY
  WITH dealer_locations AS (
    SELECT DISTINCT
      latitude,
      longitude
    FROM vehicles
    WHERE dealer_city = p_city
      AND dealer_state = p_state
      AND is_active = true
      AND latitude IS NOT NULL
      AND longitude IS NOT NULL
      -- Apply optional filters if provided
      AND (p_make IS NULL OR make = p_make)
      AND (p_body_style IS NULL OR body_style = p_body_style)
  )
  SELECT DISTINCT z.zip_code
  FROM us_zip_codes z
  CROSS JOIN dealer_locations d
  WHERE z.location IS NOT NULL
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(d.longitude, d.latitude), 4326)::geography,
      z.location,
      p_radius_miles * 1609.34
    );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_zips_for_metro(TEXT, TEXT, INT, TEXT, TEXT) IS 'Get all ZIP codes within radius of dealers in a metro, optionally filtered by inventory type (make, body_style)';

-- Maintain old 3-parameter signature for backward compatibility
-- This wrapper calls the new function with NULL for inventory filters
-- Allows zero-downtime deployment (old code keeps working)
CREATE OR REPLACE FUNCTION get_zips_for_metro(
  p_city TEXT,
  p_state TEXT,
  p_radius_miles INT
)
RETURNS TABLE (
  zip_code VARCHAR(5)
) AS $$
BEGIN
  -- Delegate to new 5-parameter signature
  RETURN QUERY SELECT * FROM get_zips_for_metro(p_city, p_state, p_radius_miles, NULL::TEXT, NULL::TEXT);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_zips_for_metro(TEXT, TEXT, INT) IS 'Get all ZIP codes within radius of dealers in a metro (backward-compatible wrapper)';
