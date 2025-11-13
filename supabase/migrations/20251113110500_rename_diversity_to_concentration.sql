-- Rename diversity_score to dealer_concentration for accuracy
-- Current formula (dealers / vehicles) measures concentration, not diversity
-- True diversity requires different calculation (see dealer-diversity.ts)

CREATE OR REPLACE FUNCTION get_metro_inventory()
RETURNS TABLE (
  metro TEXT,
  vehicle_count BIGINT,
  dealer_count BIGINT,
  dealer_concentration NUMERIC,
  top_body_styles JSONB,
  avg_price NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH metro_stats AS (
    SELECT
      v.dealer_city || ', ' || v.dealer_state as metro,
      COUNT(*) as vehicle_count,
      COUNT(DISTINCT v.dealer_id) as dealer_count,
      ROUND(COUNT(DISTINCT v.dealer_id)::numeric / COUNT(*)::numeric, 4) as dealer_concentration,
      ROUND(AVG(v.price), 2) as avg_price
    FROM vehicles v
    WHERE v.is_active = true
      AND v.dealer_city IS NOT NULL
      AND v.dealer_state IS NOT NULL
    GROUP BY v.dealer_city, v.dealer_state
    HAVING COUNT(*) >= 50
  ),
  body_style_breakdown AS (
    SELECT
      v.dealer_city || ', ' || v.dealer_state as metro,
      jsonb_agg(
        jsonb_build_object(
          'body_style', v.body_style,
          'count', v.cnt
        ) ORDER BY v.cnt DESC
      ) FILTER (WHERE v.rn <= 3) as top_body_styles
    FROM (
      SELECT
        dealer_city,
        dealer_state,
        body_style,
        COUNT(*) as cnt,
        ROW_NUMBER() OVER (PARTITION BY dealer_city, dealer_state ORDER BY COUNT(*) DESC) as rn
      FROM vehicles
      WHERE is_active = true
      GROUP BY dealer_city, dealer_state, body_style
    ) v
    GROUP BY v.dealer_city, v.dealer_state
  )
  SELECT
    ms.metro,
    ms.vehicle_count,
    ms.dealer_count,
    ms.dealer_concentration,
    COALESCE(bs.top_body_styles, '[]'::jsonb) as top_body_styles,
    ms.avg_price
  FROM metro_stats ms
  LEFT JOIN body_style_breakdown bs ON ms.metro = bs.metro
  ORDER BY ms.vehicle_count DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_metro_inventory IS 'Returns inventory breakdown by metro. dealer_concentration = dealers/vehicles (0.01 = 1% avg, lower = more concentrated)';
