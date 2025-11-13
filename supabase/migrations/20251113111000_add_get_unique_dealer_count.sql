-- Add function to get accurate unique dealer count

CREATE OR REPLACE FUNCTION get_unique_dealer_count()
RETURNS BIGINT AS $$
BEGIN
  RETURN (
    SELECT COUNT(DISTINCT dealer_id)
    FROM vehicles
    WHERE is_active = true
  );
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_unique_dealer_count IS 'Returns count of unique active dealers (not total vehicles)';
