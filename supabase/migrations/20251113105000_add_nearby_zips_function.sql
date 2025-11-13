-- Function to find ZIP codes within radius of a point
-- Used for Google Ads ZIP code targeting exports

CREATE OR REPLACE FUNCTION get_nearby_zips(
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_radius_miles INT
)
RETURNS TABLE (
  zip_code VARCHAR(5),
  city VARCHAR(100),
  state VARCHAR(2),
  distance_miles NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    z.zip_code,
    z.city,
    z.state,
    ROUND(
      ST_Distance(
        CAST(ST_MakePoint(p_longitude, p_latitude) AS geography),
        CAST(ST_MakePoint(z.longitude, z.latitude) AS geography)
      ) / 1609.34,  -- Convert meters to miles
      2
    ) as distance_miles
  FROM us_zip_codes z
  WHERE ST_DWithin(
    CAST(ST_MakePoint(p_longitude, p_latitude) AS geography),
    CAST(ST_MakePoint(z.longitude, z.latitude) AS geography),
    p_radius_miles * 1609.34  -- Convert miles to meters
  )
  ORDER BY distance_miles ASC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_nearby_zips IS 'Find ZIP codes within specified radius for Google Ads targeting';
