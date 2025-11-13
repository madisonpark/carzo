-- Fix campaign planning functions to use dealer_city instead of dma

DROP FUNCTION IF EXISTS get_metro_inventory();
DROP FUNCTION IF EXISTS get_body_style_inventory();
DROP FUNCTION IF EXISTS get_make_inventory();

-- Function: Get inventory breakdown by metro (city, state)
CREATE OR REPLACE FUNCTION get_metro_inventory()
RETURNS TABLE (
  metro TEXT,
  vehicle_count BIGINT,
  dealer_count BIGINT,
  diversity_score NUMERIC,
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
      ROUND(COUNT(DISTINCT v.dealer_id)::numeric / COUNT(*)::numeric, 2) as diversity_score,
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
    ms.diversity_score,
    COALESCE(bs.top_body_styles, '[]'::jsonb) as top_body_styles,
    ms.avg_price
  FROM metro_stats ms
  LEFT JOIN body_style_breakdown bs ON ms.metro = bs.metro
  ORDER BY ms.vehicle_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get inventory breakdown by body style
CREATE OR REPLACE FUNCTION get_body_style_inventory()
RETURNS TABLE (
  body_style TEXT,
  vehicle_count BIGINT,
  dealer_count BIGINT,
  avg_price NUMERIC,
  top_metros JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH body_style_stats AS (
    SELECT
      v.body_style,
      COUNT(*) as vehicle_count,
      COUNT(DISTINCT v.dealer_id) as dealer_count,
      ROUND(AVG(v.price), 2) as avg_price
    FROM vehicles v
    WHERE v.is_active = true AND v.body_style IS NOT NULL
    GROUP BY v.body_style
  ),
  metro_breakdown AS (
    SELECT
      bs.body_style,
      jsonb_agg(
        jsonb_build_object(
          'metro', bs.dealer_city || ', ' || bs.dealer_state,
          'count', bs.cnt
        ) ORDER BY bs.cnt DESC
      ) FILTER (WHERE bs.rn <= 3) as top_metros
    FROM (
      SELECT
        body_style,
        dealer_city,
        dealer_state,
        COUNT(*) as cnt,
        ROW_NUMBER() OVER (PARTITION BY body_style ORDER BY COUNT(*) DESC) as rn
      FROM vehicles
      WHERE is_active = true
      GROUP BY body_style, dealer_city, dealer_state
    ) bs
    GROUP BY bs.body_style
  )
  SELECT
    bs.body_style,
    bs.vehicle_count,
    bs.dealer_count,
    bs.avg_price,
    COALESCE(mb.top_metros, '[]'::jsonb) as top_metros
  FROM body_style_stats bs
  LEFT JOIN metro_breakdown mb ON bs.body_style = mb.body_style
  ORDER BY bs.vehicle_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function: Get inventory breakdown by make
CREATE OR REPLACE FUNCTION get_make_inventory()
RETURNS TABLE (
  make TEXT,
  vehicle_count BIGINT,
  dealer_count BIGINT,
  avg_price NUMERIC,
  top_body_styles JSONB,
  top_metros JSONB
) AS $$
BEGIN
  RETURN QUERY
  WITH make_stats AS (
    SELECT
      v.make,
      COUNT(*) as vehicle_count,
      COUNT(DISTINCT v.dealer_id) as dealer_count,
      ROUND(AVG(v.price), 2) as avg_price
    FROM vehicles v
    WHERE v.is_active = true
    GROUP BY v.make
    HAVING COUNT(*) >= 100
  ),
  body_style_breakdown AS (
    SELECT
      m.make,
      jsonb_agg(
        jsonb_build_object(
          'body_style', m.body_style,
          'count', m.cnt
        ) ORDER BY m.cnt DESC
      ) FILTER (WHERE m.rn <= 3) as top_body_styles
    FROM (
      SELECT
        make,
        body_style,
        COUNT(*) as cnt,
        ROW_NUMBER() OVER (PARTITION BY make ORDER BY COUNT(*) DESC) as rn
      FROM vehicles
      WHERE is_active = true
      GROUP BY make, body_style
    ) m
    GROUP BY m.make
  ),
  metro_breakdown AS (
    SELECT
      m.make,
      jsonb_agg(
        jsonb_build_object(
          'metro', m.dealer_city || ', ' || m.dealer_state,
          'count', m.cnt
        ) ORDER BY m.cnt DESC
      ) FILTER (WHERE m.rn <= 3) as top_metros
    FROM (
      SELECT
        make,
        dealer_city,
        dealer_state,
        COUNT(*) as cnt,
        ROW_NUMBER() OVER (PARTITION BY make ORDER BY COUNT(*) DESC) as rn
      FROM vehicles
      WHERE is_active = true
      GROUP BY make, dealer_city, dealer_state
    ) m
    GROUP BY m.make
  )
  SELECT
    ms.make,
    ms.vehicle_count,
    ms.dealer_count,
    ms.avg_price,
    COALESCE(bs.top_body_styles, '[]'::jsonb) as top_body_styles,
    COALESCE(mb.top_metros, '[]'::jsonb) as top_metros
  FROM make_stats ms
  LEFT JOIN body_style_breakdown bs ON ms.make = bs.make
  LEFT JOIN metro_breakdown mb ON ms.make = mb.make
  ORDER BY ms.vehicle_count DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_metro_inventory IS 'Returns inventory breakdown by metro (city, state) for campaign planning';
COMMENT ON FUNCTION get_body_style_inventory IS 'Returns inventory breakdown by body style (SUV, Truck, Sedan)';
COMMENT ON FUNCTION get_make_inventory IS 'Returns inventory breakdown by make (Toyota, Ford, Kia)';
