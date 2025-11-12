-- Migration: Create Rate Limiting Infrastructure
-- Purpose: Implement rate limiting using PostgreSQL unlogged tables
-- Performance: Unlogged tables are ~3x faster for writes (skip WAL)
-- Trade-off: Data lost on crash, but acceptable for ephemeral rate limit counters

-- Create unlogged table for rate limit tracking
-- UNLOGGED = No Write-Ahead Log overhead, much faster writes
-- Data is ephemeral (lost on crash), but that's fine for rate limiting
CREATE UNLOGGED TABLE IF NOT EXISTS rate_limits (
  id BIGSERIAL PRIMARY KEY,
  identifier TEXT NOT NULL,           -- IP address or user ID
  endpoint TEXT NOT NULL,              -- API endpoint being rate limited
  window_start TIMESTAMPTZ NOT NULL,   -- Start of rate limit window
  request_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Unique constraint for upsert pattern
  UNIQUE(identifier, endpoint, window_start)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_lookup
ON rate_limits(identifier, endpoint, window_start);

-- Index for cleanup (remove old records)
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup
ON rate_limits(window_start);

-- Function: Check and increment rate limit
-- Returns TRUE if request is allowed, FALSE if rate limit exceeded
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
  -- For 60-second window: floor(now, 60 seconds)
  -- For 1-second window: floor(now, 1 second)
  -- For 3600-second window: floor(now, 1 hour)
  v_window_start := TO_TIMESTAMP(
    FLOOR(EXTRACT(EPOCH FROM NOW()) / p_window_seconds) * p_window_seconds
  );

  -- Use advisory lock to prevent race conditions
  -- Combine hash with epoch to reduce collision risk under high load
  PERFORM pg_advisory_xact_lock(
    hashtext(p_identifier || '::' || p_endpoint || '::' || v_window_start::TEXT),
    EXTRACT(EPOCH FROM v_window_start)::INTEGER
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

-- Function: Cleanup old rate limit records
-- Should be called periodically via cron to prevent table bloat
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Delete records older than 1 hour
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '1 hour';

  GET DIAGNOSTICS v_deleted = ROW_COUNT;

  RAISE NOTICE 'Cleaned up % old rate limit records', v_deleted;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_rate_limits TO authenticated;

-- Add comment
COMMENT ON TABLE rate_limits IS 'Rate limiting counters using unlogged table for performance. Data is ephemeral and lost on crash, which is acceptable for rate limits.';
COMMENT ON FUNCTION check_rate_limit IS 'Check if request is within rate limit and increment counter atomically.';
COMMENT ON FUNCTION cleanup_rate_limits IS 'Remove rate limit records older than 1 hour to prevent table bloat.';
