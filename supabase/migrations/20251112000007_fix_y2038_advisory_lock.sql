-- Migration: Fix Y2038 Problem in Advisory Lock
-- Purpose: Replace INTEGER epoch cast with double-hash approach
-- Issue: Previous implementation would overflow in 2038
-- Credit: Suggested by @gemini-code-assist in PR review

-- Update check_rate_limit function with Y2038-safe advisory lock
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

COMMENT ON FUNCTION check_rate_limit IS 'Check if request is within rate limit and increment counter atomically. Uses Y2038-safe double-hash advisory locking.';
