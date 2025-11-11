-- Fix ALL column size constraints based on actual feed data analysis
-- This prevents incremental failures during bulk import

ALTER TABLE vehicles
  ALTER COLUMN model TYPE VARCHAR(100),
  ALTER COLUMN trim TYPE VARCHAR(150),
  ALTER COLUMN transmission TYPE VARCHAR(100),
  ALTER COLUMN fuel_type TYPE VARCHAR(100),
  ALTER COLUMN drive_type TYPE VARCHAR(100),
  ALTER COLUMN exterior_color TYPE VARCHAR(100),
  ALTER COLUMN interior_color TYPE VARCHAR(100),
  ALTER COLUMN dealer_name TYPE VARCHAR(300);
