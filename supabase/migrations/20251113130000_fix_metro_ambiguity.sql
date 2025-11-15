-- Fix ambiguous metro column reference in get_metro_inventory

DROP FUNCTION IF EXISTS get_metro_inventory();

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
      COALESCE(v.dma, v.dealer_city || ', ' || v.dealer_state) as metro,
      COUNT(*) as vehicle_count,
      COUNT(DISTINCT v.dealer_id) as dealer_count,
      ROUND(COUNT(DISTINCT v.dealer_id)::numeric / COUNT(*)::numeric, 4) as dealer_concentration,
      ROUND(AVG(v.price), 2) as avg_price
    FROM vehicles v
    WHERE v.is_active = true
      AND (v.dma IS NOT NULL OR (v.dealer_city IS NOT NULL AND v.dealer_state IS NOT NULL))
    GROUP BY COALESCE(v.dma, v.dealer_city || ', ' || v.dealer_state)
    HAVING COUNT(*) >= 50
  ),
  body_style_breakdown AS (
    SELECT
      ranked_styles.metro_name,
      jsonb_agg(
        jsonb_build_object(
          'body_style', ranked_styles.body_style,
          'count', ranked_styles.cnt
        ) ORDER BY ranked_styles.cnt DESC
      ) FILTER (WHERE ranked_styles.rn <= 3) as top_body_styles
    FROM (
      SELECT
        COALESCE(v.dma, v.dealer_city || ', ' || v.dealer_state) as metro_name,
        v.body_style,
        COUNT(*) as cnt,
        ROW_NUMBER() OVER (
          PARTITION BY COALESCE(v.dma, v.dealer_city || ', ' || v.dealer_state)
          ORDER BY COUNT(*) DESC
        ) as rn
      FROM vehicles v
      WHERE v.is_active = true
        AND (v.dma IS NOT NULL OR (v.dealer_city IS NOT NULL AND v.dealer_state IS NOT NULL))
      GROUP BY COALESCE(v.dma, v.dealer_city || ', ' || v.dealer_state), v.body_style
    ) ranked_styles
    GROUP BY ranked_styles.metro_name
  )
  SELECT
    ms.metro,
    ms.vehicle_count,
    ms.dealer_count,
    ms.dealer_concentration,
    COALESCE(bs.top_body_styles, '[]'::jsonb) as top_body_styles,
    ms.avg_price
  FROM metro_stats ms
  LEFT JOIN body_style_breakdown bs ON ms.metro = bs.metro_name
  ORDER BY ms.vehicle_count DESC;
END;
$$ LANGUAGE plpgsql;
