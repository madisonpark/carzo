-- Update get_zips_for_metro to support inventory filtering
-- This allows targeting only areas near dealers that have specific inventory

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

COMMENT ON FUNCTION get_zips_for_metro IS 'Get all ZIP codes within radius of dealers in a metro, optionally filtered by inventory type';
