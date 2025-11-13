-- Improve DMA column constraints and indexes

-- Backfill any NULL certified values (shouldn't exist due to DEFAULT, but be safe)
UPDATE vehicles SET certified = false WHERE certified IS NULL;

-- Add NOT NULL constraint to certified (safe after backfill)
ALTER TABLE vehicles ALTER COLUMN certified SET NOT NULL;

-- Note: No CHECK constraint on dol - application validates >= 0 in parseDol()
-- This allows resilient parsing (bad data → null) instead of hard insert failures
-- Per CLAUDE.md: Prefer robust parsing over strict constraints for external data

-- Replace regular indexes with partial indexes (exclude NULL dma values)
DROP INDEX IF EXISTS idx_vehicles_dma;
DROP INDEX IF EXISTS idx_vehicles_dma_body_style;
DROP INDEX IF EXISTS idx_vehicles_dma_make;

CREATE INDEX idx_vehicles_dma ON vehicles(dma) WHERE dma IS NOT NULL;
CREATE INDEX idx_vehicles_dma_body_style ON vehicles(dma, body_style) WHERE dma IS NOT NULL;
CREATE INDEX idx_vehicles_dma_make ON vehicles(dma, make) WHERE dma IS NOT NULL;

COMMENT ON CONSTRAINT check_dol_non_negative ON vehicles IS 'Days on lot cannot be negative';
