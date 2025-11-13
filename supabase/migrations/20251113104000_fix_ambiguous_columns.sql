-- Fix ambiguous column references in campaign planning functions

DROP FUNCTION IF EXISTS get_body_style_inventory();
DROP FUNCTION IF EXISTS get_make_inventory();

-- Function: Get inventory breakdown by body style (FIXED)
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
      subq.body_style,
      jsonb_agg(
        jsonb_build_object(
          'metro', subq.dealer_city || ', ' || subq.dealer_state,
          'count', subq.cnt
        ) ORDER BY subq.cnt DESC
      ) FILTER (WHERE subq.rn <= 3) as top_metros
    FROM (
      SELECT
        v2.body_style,
        v2.dealer_city,
        v2.dealer_state,
        COUNT(*) as cnt,
        ROW_NUMBER() OVER (PARTITION BY v2.body_style ORDER BY COUNT(*) DESC) as rn
      FROM vehicles v2
      WHERE v2.is_active = true
      GROUP BY v2.body_style, v2.dealer_city, v2.dealer_state
    ) subq
    GROUP BY subq.body_style
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

-- Function: Get inventory breakdown by make (FIXED)
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
      subq1.make,
      jsonb_agg(
        jsonb_build_object(
          'body_style', subq1.body_style,
          'count', subq1.cnt
        ) ORDER BY subq1.cnt DESC
      ) FILTER (WHERE subq1.rn <= 3) as top_body_styles
    FROM (
      SELECT
        v2.make,
        v2.body_style,
        COUNT(*) as cnt,
        ROW_NUMBER() OVER (PARTITION BY v2.make ORDER BY COUNT(*) DESC) as rn
      FROM vehicles v2
      WHERE v2.is_active = true
      GROUP BY v2.make, v2.body_style
    ) subq1
    GROUP BY subq1.make
  ),
  metro_breakdown AS (
    SELECT
      subq2.make,
      jsonb_agg(
        jsonb_build_object(
          'metro', subq2.dealer_city || ', ' || subq2.dealer_state,
          'count', subq2.cnt
        ) ORDER BY subq2.cnt DESC
      ) FILTER (WHERE subq2.rn <= 3) as top_metros
    FROM (
      SELECT
        v3.make,
        v3.dealer_city,
        v3.dealer_state,
        COUNT(*) as cnt,
        ROW_NUMBER() OVER (PARTITION BY v3.make ORDER BY COUNT(*) DESC) as rn
      FROM vehicles v3
      WHERE v3.is_active = true
      GROUP BY v3.make, v3.dealer_city, v3.dealer_state
    ) subq2
    GROUP BY subq2.make
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
