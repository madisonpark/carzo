-- Migration: Add flow column to impressions table for A/B testing
-- Purpose: Track which user flow generated each impression (direct, vdp-only, full)
-- Date: 2025-11-12

-- Add flow column to impressions table
ALTER TABLE impressions ADD COLUMN flow VARCHAR(20) DEFAULT 'full';

-- Create index for flow-based queries
CREATE INDEX idx_impressions_flow ON impressions(flow);

-- Add comment for documentation
COMMENT ON COLUMN impressions.flow IS 'A/B test flow variant: direct (SERP→Dealer), vdp-only (VDP→Dealer), full (SERP→VDP→Dealer, default)';
