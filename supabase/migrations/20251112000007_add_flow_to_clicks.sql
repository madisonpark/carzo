-- Migration: Add flow column to clicks table for A/B testing
-- Purpose: Track which user flow generated each click (direct, vdp-only, full)
-- Date: 2025-11-12

-- Add flow column to clicks table
ALTER TABLE clicks ADD COLUMN flow VARCHAR(20) DEFAULT 'full';

-- Create index for flow-based queries
CREATE INDEX idx_clicks_flow ON clicks(flow);

-- Add comment for documentation
COMMENT ON COLUMN clicks.flow IS 'A/B test flow variant: direct (SERP→Dealer), vdp-only (VDP→Dealer), full (SERP→VDP→Dealer, default)';
