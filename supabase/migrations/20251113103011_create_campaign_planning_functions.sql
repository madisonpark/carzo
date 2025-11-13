-- Campaign Planning Database Functions
-- These functions power the media buying dashboard

-- Function: Get inventory breakdown by metro/DMA
CREATE OR REPLACE FUNCTION get_metro_inventory()
RETURNS TABLE (
  dma TEXT,
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
      v.dma,
      COUNT(*) as vehicle_count,
      COUNT(DISTINCT v.dealer_id) as dealer_count,
      ROUND(COUNT(DISTINCT v.dealer_id)::numeric / COUNT(*)::numeric, 2) as diversity_score,
      ROUND(AVG(v.price), 2) as avg_price
    FROM vehicles v
    WHERE v.is_active = true
    GROUP BY v.dma
    HAVING COUNT(*) >= 50  -- Minimum threshold for advertising
  ),
  body_style_breakdown AS (
    SELECT
      v.dma,
      jsonb_agg(
        jsonb_build_object(
          'body_style', v.body_style,
          'count', cnt
        ) ORDER BY cnt DESC
      ) FILTER (WHERE rn <= 3) as top_body_styles
    FROM (
      SELECT
        dma,
        body_style,
        COUNT(*) as cnt,
        ROW_NUMBER() OVER (PARTITION BY dma ORDER BY COUNT(*) DESC) as rn
      FROM vehicles
      WHERE is_active = true
      GROUP BY dma, body_style
    ) v
    GROUP BY v.dma
  )
  SELECT
    ms.dma,
    ms.vehicle_count,
    ms.dealer_count,
    ms.diversity_score,
    COALESCE(bs.top_body_styles, '[]'::jsonb) as top_body_styles,
    ms.avg_price
  FROM metro_stats ms
  LEFT JOIN body_style_breakdown bs ON ms.dma = bs.dma
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
      v.body_style,
      jsonb_agg(
        jsonb_build_object(
          'metro', v.dma,
          'count', cnt
        ) ORDER BY cnt DESC
      ) FILTER (WHERE rn <= 3) as top_metros
    FROM (
      SELECT
        body_style,
        dma,
        COUNT(*) as cnt,
        ROW_NUMBER() OVER (PARTITION BY body_style ORDER BY COUNT(*) DESC) as rn
      FROM vehicles
      WHERE is_active = true
      GROUP BY body_style, dma
    ) v
    GROUP BY v.body_style
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
    HAVING COUNT(*) >= 100  -- Minimum threshold
  ),
  body_style_breakdown AS (
    SELECT
      v.make,
      jsonb_agg(
        jsonb_build_object(
          'body_style', v.body_style,
          'count', cnt
        ) ORDER BY cnt DESC
      ) FILTER (WHERE rn <= 3) as top_body_styles
    FROM (
      SELECT
        make,
        body_style,
        COUNT(*) as cnt,
        ROW_NUMBER() OVER (PARTITION BY make ORDER BY COUNT(*) DESC) as rn
      FROM vehicles
      WHERE is_active = true
      GROUP BY make, body_style
    ) v
    GROUP BY v.make
  ),
  metro_breakdown AS (
    SELECT
      v.make,
      jsonb_agg(
        jsonb_build_object(
          'metro', v.dma,
          'count', cnt
        ) ORDER BY cnt DESC
      ) FILTER (WHERE rn <= 3) as top_metros
    FROM (
      SELECT
        make,
        dma,
        COUNT(*) as cnt,
        ROW_NUMBER() OVER (PARTITION BY make ORDER BY COUNT(*) DESC) as rn
      FROM vehicles
      WHERE is_active = true
      GROUP BY make, dma
    ) v
    GROUP BY v.make
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

-- Function: Get inventory snapshot (quick stats)
CREATE OR REPLACE FUNCTION get_inventory_snapshot()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH totals AS (
    SELECT
      COUNT(*) as total_vehicles,
      COUNT(DISTINCT dealer_id) as total_dealers,
      jsonb_object_agg(dma, vehicle_count) as by_metro,
      jsonb_object_agg(body_style, body_count) as by_body_style,
      jsonb_object_agg(make, make_count) as by_make
    FROM (
      SELECT
        dma,
        body_style,
        make,
        dealer_id,
        COUNT(*) OVER () as vehicle_count,
        COUNT(*) OVER (PARTITION BY dma) as dma_count,
        COUNT(*) OVER (PARTITION BY body_style) as body_count,
        COUNT(*) OVER (PARTITION BY make) as make_count
      FROM vehicles
      WHERE is_active = true
      LIMIT 1  -- We just need the aggregates
    ) v
  )
  SELECT jsonb_build_object(
    'total_vehicles', total_vehicles,
    'total_dealers', total_dealers,
    'by_metro', by_metro,
    'by_body_style', by_body_style,
    'by_make', by_make
  ) INTO result
  FROM totals;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_metro_inventory IS 'Returns inventory breakdown by metro/DMA for campaign planning';
COMMENT ON FUNCTION get_body_style_inventory IS 'Returns inventory breakdown by body style (SUV, Truck, Sedan)';
COMMENT ON FUNCTION get_make_inventory IS 'Returns inventory breakdown by make (Toyota, Ford, Kia)';
COMMENT ON FUNCTION get_inventory_snapshot IS 'Returns quick inventory stats for dashboard';
