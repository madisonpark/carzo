-- Add DMA and missing LotLinx fields to vehicles table
-- These fields are provided by LotLinx but weren't being saved

-- Add new columns
ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS dma VARCHAR(100),
ADD COLUMN IF NOT EXISTS certified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dol INT; -- Days on lot

-- Add index on dma for campaign planning queries
CREATE INDEX IF NOT EXISTS idx_vehicles_dma ON vehicles(dma);

-- Add composite index for campaign planning (dma + body_style)
CREATE INDEX IF NOT EXISTS idx_vehicles_dma_body_style ON vehicles(dma, body_style);

-- Add composite index for make campaigns
CREATE INDEX IF NOT EXISTS idx_vehicles_dma_make ON vehicles(dma, make);

COMMENT ON COLUMN vehicles.dma IS 'Designated Marketing Area from LotLinx (for advertising targeting)';
COMMENT ON COLUMN vehicles.certified IS 'Certified Pre-Owned status';
COMMENT ON COLUMN vehicles.dol IS 'Days on lot (from LotLinx feed)';
