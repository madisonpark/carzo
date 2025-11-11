-- Add radius column for location-based targeting
-- This comes from the LotLinx feed and indicates the targeting radius in miles
ALTER TABLE vehicles
  ADD COLUMN targeting_radius INT DEFAULT 30;

-- Index for location-based filtering
CREATE INDEX idx_vehicles_location_radius ON vehicles(latitude, longitude, targeting_radius) WHERE is_active = true;
