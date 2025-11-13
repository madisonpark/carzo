-- Improve DMA column constraints and indexes

-- Add NOT NULL constraint to certified (safe because of DEFAULT false)
ALTER TABLE vehicles ALTER COLUMN certified SET NOT NULL;

-- Add CHECK constraint to dol (days on lot must be non-negative)
ALTER TABLE vehicles ADD CONSTRAINT check_dol_non_negative CHECK (dol >= 0);

-- Replace regular indexes with partial indexes (exclude NULL dma values)
DROP INDEX IF EXISTS idx_vehicles_dma;
DROP INDEX IF EXISTS idx_vehicles_dma_body_style;
DROP INDEX IF EXISTS idx_vehicles_dma_make;

CREATE INDEX idx_vehicles_dma ON vehicles(dma) WHERE dma IS NOT NULL;
CREATE INDEX idx_vehicles_dma_body_style ON vehicles(dma, body_style) WHERE dma IS NOT NULL;
CREATE INDEX idx_vehicles_dma_make ON vehicles(dma, make) WHERE dma IS NOT NULL;

COMMENT ON CONSTRAINT check_dol_non_negative ON vehicles IS 'Days on lot cannot be negative';
