-- Fix column size constraints for vehicle data
-- Some fields have values longer than their current limits

ALTER TABLE vehicles
  ALTER COLUMN interior_color TYPE VARCHAR(100),
  ALTER COLUMN exterior_color TYPE VARCHAR(100),
  ALTER COLUMN model TYPE VARCHAR(100),
  ALTER COLUMN transmission TYPE VARCHAR(100),
  ALTER COLUMN fuel_type TYPE VARCHAR(100),
  ALTER COLUMN drive_type TYPE VARCHAR(100);
