-- Add bulk ZIP code lookup to fix N+1 query problem
-- Instead of querying each dealer location separately, query all at once

CREATE OR REPLACE FUNCTION get_zips_for_metro(
  p_city TEXT,
  p_state TEXT,
  p_radius_miles INT DEFAULT 25
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

COMMENT ON FUNCTION get_zips_for_metro IS 'Get all ZIP codes within radius of ANY dealer in a metro (single query, no N+1)';
