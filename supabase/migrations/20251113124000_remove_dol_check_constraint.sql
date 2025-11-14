-- Remove CHECK constraint on dol
-- Prefer resilient application-level validation over strict DB constraints
-- This allows bad data from LotLinx to be converted to null instead of failing inserts

ALTER TABLE vehicles DROP CONSTRAINT IF EXISTS check_dol_non_negative;

COMMENT ON COLUMN vehicles.dol IS 'Days on lot from LotLinx (validated >= 0 by parseDol(), negative values become null)';
