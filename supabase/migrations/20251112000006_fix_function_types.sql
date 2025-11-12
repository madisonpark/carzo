-- Fix: Update get_filter_options_by_location with proper type casting
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
        LEAST(COALESCE(v.targeting_radius, 30), 100) * 1609.34
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
    ARRAY(SELECT DISTINCT make::TEXT FROM filtered_vehicles WHERE make IS NOT NULL ORDER BY make),
    ARRAY(SELECT DISTINCT body_style::TEXT FROM filtered_vehicles WHERE body_style IS NOT NULL ORDER BY body_style),
    ARRAY(SELECT DISTINCT condition::TEXT FROM filtered_vehicles WHERE condition IS NOT NULL ORDER BY condition),
    ARRAY(SELECT DISTINCT year FROM filtered_vehicles WHERE year IS NOT NULL ORDER BY year DESC);
END;
$$ LANGUAGE plpgsql STABLE;

-- Fix: Update check_rate_limit with correct INTEGER type for advisory lock
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_identifier TEXT,
  p_endpoint TEXT,
  p_limit INTEGER,
  p_window_seconds INTEGER
)
RETURNS TABLE (
  allowed BOOLEAN,
  current_count INTEGER,
  limit_value INTEGER,
  window_reset TIMESTAMPTZ
) AS $$
DECLARE
  v_window_start TIMESTAMPTZ;
  v_count INTEGER;
BEGIN
  -- Calculate window start (floor to window boundary)
  v_window_start := TO_TIMESTAMP(
    FLOOR(EXTRACT(EPOCH FROM NOW()) / p_window_seconds) * p_window_seconds
  );

  -- Use advisory lock to prevent race conditions
  -- Use two separate hashes to avoid Y2038 problem (INTEGER overflow)
  -- This maintains uniqueness without timestamp limitations
  PERFORM pg_advisory_xact_lock(
    hashtext(p_identifier || '::' || p_endpoint),
    hashtext(v_window_start::TEXT)
  );

  -- Get or create counter using upsert
  INSERT INTO rate_limits (identifier, endpoint, window_start, request_count, updated_at)
  VALUES (p_identifier, p_endpoint, v_window_start, 1, NOW())
  ON CONFLICT (identifier, endpoint, window_start)
  DO UPDATE SET
    request_count = rate_limits.request_count + 1,
    updated_at = NOW()
  RETURNING rate_limits.request_count INTO v_count;

  -- Return result
  RETURN QUERY SELECT
    v_count <= p_limit AS allowed,
    v_count AS current_count,
    p_limit AS limit_value,
    v_window_start + (p_window_seconds || ' seconds')::INTERVAL AS window_reset;
END;
$$ LANGUAGE plpgsql;
