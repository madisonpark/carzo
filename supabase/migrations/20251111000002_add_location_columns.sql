-- Add latitude and longitude columns for location-based search
ALTER TABLE vehicles
  ADD COLUMN latitude DECIMAL(10, 7),
  ADD COLUMN longitude DECIMAL(10, 7);

-- Create index for location-based queries
CREATE INDEX idx_vehicles_location ON vehicles(latitude, longitude) WHERE is_active = true;
