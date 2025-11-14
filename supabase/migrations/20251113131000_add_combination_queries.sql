-- Add database functions for make+body_style and make+model combinations

-- Function: Get top make + body_style combinations
CREATE OR REPLACE FUNCTION get_make_bodystyle_combos()
RETURNS TABLE (
  combo_name TEXT,
  vehicle_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (v.make || ' ' || v.body_style)::TEXT as combo_name,
    COUNT(*) as vehicle_count
  FROM vehicles v
  WHERE v.is_active = true
    AND v.make IS NOT NULL
    AND v.body_style IS NOT NULL
  GROUP BY v.make, v.body_style
  HAVING COUNT(*) >= 100
  ORDER BY COUNT(*) DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- Function: Get top make + model combinations
CREATE OR REPLACE FUNCTION get_make_model_combos()
RETURNS TABLE (
  combo_name TEXT,
  vehicle_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (v.make || ' ' || v.model)::TEXT as combo_name,
    COUNT(*) as vehicle_count
  FROM vehicles v
  WHERE v.is_active = true
    AND v.make IS NOT NULL
    AND v.model IS NOT NULL
  GROUP BY v.make, v.model
  HAVING COUNT(*) >= 50
  ORDER BY COUNT(*) DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_make_bodystyle_combos IS 'Returns top make + body style combinations (e.g., "Toyota SUV", "Ford Truck")';
COMMENT ON FUNCTION get_make_model_combos IS 'Returns top make + model combinations (e.g., "Jeep Grand Cherokee", "Kia Sorento")';
