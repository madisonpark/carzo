-- Migration: Create Spatial Query Functions
-- Purpose: Stored procedures for radius-based vehicle search
-- Performance: Uses PostGIS ST_DWithin for fast spatial queries
-- Issue: https://github.com/madisonpark/carzo/issues/3

-- Function: Search vehicles within targeting radius
-- Returns vehicles where user location is within the vehicle's targeting_radius
CREATE OR REPLACE FUNCTION search_vehicles_by_location(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  p_make TEXT DEFAULT NULL,
  p_model TEXT DEFAULT NULL,
  p_condition TEXT DEFAULT NULL,
  p_body_style TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_year INTEGER DEFAULT NULL,
  p_max_year INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 1000,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  vin VARCHAR(17),
  year INTEGER,
  make VARCHAR(100),
  model VARCHAR(100),
  trim VARCHAR(100),
  price NUMERIC(10,2),
  miles INTEGER,
  condition VARCHAR(20),
  body_style VARCHAR(50),
  primary_image_url TEXT,
  transmission VARCHAR(50),
  fuel_type VARCHAR(50),
  drive_type VARCHAR(50),
  exterior_color VARCHAR(50),
  interior_color VARCHAR(50),
  doors INTEGER,
  cylinders INTEGER,
  description TEXT,
  dealer_id VARCHAR(50),
  dealer_name VARCHAR(255),
  dealer_city VARCHAR(100),
  dealer_state VARCHAR(2),
  dealer_zip VARCHAR(10),
  dealer_vdp_url TEXT,
  total_photos INTEGER,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  targeting_radius INTEGER,
  distance_miles DOUBLE PRECISION
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.id,
    v.vin,
    v.year,
    v.make,
    v.model,
    v.trim,
    v.price,
    v.miles,
    v.condition,
    v.body_style,
    v.primary_image_url,
    v.transmission,
    v.fuel_type,
    v.drive_type,
    v.exterior_color,
    v.interior_color,
    v.doors,
    v.cylinders,
    v.description,
    v.dealer_id,
    v.dealer_name,
    v.dealer_city,
    v.dealer_state,
    v.dealer_zip,
    v.dealer_vdp_url,
    v.total_photos,
    v.latitude,
    v.longitude,
    v.targeting_radius,
    -- Calculate distance in miles
    ST_Distance(
      v.location,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography
    ) / 1609.34 AS distance_miles
  FROM vehicles v
  WHERE v.is_active = true
    AND v.location IS NOT NULL
    -- ST_DWithin: Fast spatial query using GIST index
    -- Convert miles to meters: targeting_radius * 1609.34
    AND ST_DWithin(
      v.location,
      ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
      COALESCE(v.targeting_radius, 30) * 1609.34
    )
    -- Apply filters
    AND (p_make IS NULL OR v.make = p_make)
    AND (p_model IS NULL OR v.model = p_model)
    AND (p_condition IS NULL OR v.condition = p_condition)
    AND (p_body_style IS NULL OR v.body_style = p_body_style)
    AND (p_min_price IS NULL OR v.price >= p_min_price)
    AND (p_max_price IS NULL OR v.price <= p_max_price)
    AND (p_min_year IS NULL OR v.year >= p_min_year)
    AND (p_max_year IS NULL OR v.year <= p_max_year)
  ORDER BY distance_miles ASC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Get unique filter options for location-based search
-- Returns distinct makes, body styles, conditions, and years within radius
CREATE OR REPLACE FUNCTION get_filter_options_by_location(
  user_lat DOUBLE PRECISION,
  user_lon DOUBLE PRECISION,
  p_make TEXT DEFAULT NULL,
  p_model TEXT DEFAULT NULL,
  p_condition TEXT DEFAULT NULL,
  p_body_style TEXT DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_min_year INTEGER DEFAULT NULL,
  p_max_year INTEGER DEFAULT NULL
)
RETURNS TABLE (
  makes TEXT[],
  body_styles TEXT[],
  conditions TEXT[],
  years INTEGER[]
) AS $$
BEGIN
  RETURN QUERY
  WITH filtered_vehicles AS (
    SELECT
      v.make,
      v.body_style,
      v.condition,
      v.year
    FROM vehicles v
    WHERE v.is_active = true
      AND v.location IS NOT NULL
      AND ST_DWithin(
        v.location,
        ST_SetSRID(ST_MakePoint(user_lon, user_lat), 4326)::geography,
        COALESCE(v.targeting_radius, 30) * 1609.34
      )
      AND (p_make IS NULL OR v.make = p_make)
      AND (p_model IS NULL OR v.model = p_model)
      AND (p_condition IS NULL OR v.condition = p_condition)
      AND (p_body_style IS NULL OR v.body_style = p_body_style)
      AND (p_min_price IS NULL OR v.price >= p_min_price)
      AND (p_max_price IS NULL OR v.price <= p_max_price)
      AND (p_min_year IS NULL OR v.year >= p_min_year)
      AND (p_max_year IS NULL OR v.year <= p_max_year)
  )
  SELECT
    ARRAY(SELECT DISTINCT make FROM filtered_vehicles WHERE make IS NOT NULL ORDER BY make),
    ARRAY(SELECT DISTINCT body_style FROM filtered_vehicles WHERE body_style IS NOT NULL ORDER BY body_style),
    ARRAY(SELECT DISTINCT condition FROM filtered_vehicles WHERE condition IS NOT NULL ORDER BY condition),
    ARRAY(SELECT DISTINCT year FROM filtered_vehicles WHERE year IS NOT NULL ORDER BY year DESC);
END;
$$ LANGUAGE plpgsql STABLE;

-- Add comments for documentation
COMMENT ON FUNCTION search_vehicles_by_location IS 'Fast spatial search using PostGIS ST_DWithin. Returns vehicles within their targeting radius, sorted by distance.';
COMMENT ON FUNCTION get_filter_options_by_location IS 'Get available filter options for vehicles within radius. Uses spatial index for performance.';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION search_vehicles_by_location TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_filter_options_by_location TO authenticated, anon;
