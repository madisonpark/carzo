-- Carzo Database Schema for Supabase
-- Business Model: $0.80 per UNIQUE DEALER per user per 30 days

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Vehicles table (denormalized for simplicity)
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vin VARCHAR(17) UNIQUE NOT NULL,

  -- Display info
  year INT NOT NULL,
  make VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  trim VARCHAR(100),
  price DECIMAL(10,2) NOT NULL,
  miles INT,
  condition VARCHAR(20), -- new/used/cpo
  body_style VARCHAR(50),

  -- Images
  primary_image_url TEXT NOT NULL,
  blur_thumb_1 TEXT, -- Generated blurred thumbnail
  blur_thumb_2 TEXT, -- Generated blurred thumbnail
  total_photos INT DEFAULT 15, -- For "+X More" display

  -- Specs
  transmission VARCHAR(50),
  fuel_type VARCHAR(50),
  drive_type VARCHAR(20),
  exterior_color VARCHAR(50),
  interior_color VARCHAR(50),
  mpg_city INT,
  mpg_highway INT,
  doors INT,
  cylinders INT,

  -- Description
  description TEXT,
  features TEXT[], -- Array for bullet list
  options TEXT,

  -- CRITICAL: Dealer info (denormalized)
  dealer_id VARCHAR(50) NOT NULL, -- LotLinx dealer ID
  dealer_name VARCHAR(255) NOT NULL,
  dealer_address VARCHAR(255),
  dealer_city VARCHAR(100),
  dealer_state VARCHAR(2),
  dealer_zip VARCHAR(5),
  dealer_vdp_url TEXT NOT NULL, -- LotLinx click URL

  -- Metadata
  is_active BOOLEAN DEFAULT true,
  last_sync TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for search performance
CREATE INDEX idx_make ON vehicles(make);
CREATE INDEX idx_model ON vehicles(model);
CREATE INDEX idx_body_style ON vehicles(body_style);
CREATE INDEX idx_price ON vehicles(price);
CREATE INDEX idx_condition ON vehicles(condition);
CREATE INDEX idx_year ON vehicles(year);
CREATE INDEX idx_is_active ON vehicles(is_active);
CREATE INDEX idx_vin ON vehicles(vin);

-- CRITICAL: Dealer indexes for diversification
CREATE INDEX idx_dealer ON vehicles(dealer_id);
CREATE INDEX idx_dealer_make ON vehicles(dealer_id, make);

-- Composite for common queries
CREATE INDEX idx_search_combo ON vehicles(make, model, body_style, is_active);
CREATE INDEX idx_active_make ON vehicles(is_active, make) WHERE is_active = true;

-- Click tracking with dealer deduplication
CREATE TABLE clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  dealer_id VARCHAR(50) NOT NULL, -- CRITICAL for deduplication
  user_id VARCHAR(255) NOT NULL, -- Cookie/fingerprint ID
  session_id VARCHAR(255),

  -- Deduplication tracking
  is_billable BOOLEAN DEFAULT true, -- First click to this dealer in 30 days?

  -- Click details
  cta_clicked VARCHAR(50), -- 'primary', 'history', 'payment', 'description'
  utm_source VARCHAR(50),
  utm_medium VARCHAR(50),
  utm_campaign VARCHAR(100),

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_clicks_dealer ON clicks(dealer_id);
CREATE INDEX idx_clicks_user ON clicks(user_id, created_at);
CREATE INDEX idx_clicks_billable ON clicks(is_billable);
CREATE INDEX idx_clicks_vehicle ON clicks(vehicle_id);
CREATE INDEX idx_clicks_created ON clicks(created_at);

-- Track dealer click history per user (30-day window)
CREATE TABLE dealer_click_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id VARCHAR(255) NOT NULL,
  dealer_id VARCHAR(50) NOT NULL,
  first_click_at TIMESTAMP NOT NULL,
  last_click_at TIMESTAMP NOT NULL,
  click_count INT DEFAULT 1,

  UNIQUE(user_id, dealer_id)
);

CREATE INDEX idx_history_user ON dealer_click_history(user_id);
CREATE INDEX idx_history_dealer ON dealer_click_history(dealer_id);
CREATE INDEX idx_history_expires ON dealer_click_history(first_click_at);

-- Impressions (for CTR calculation)
CREATE TABLE impressions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID REFERENCES vehicles(id) NOT NULL,
  page_type VARCHAR(20), -- 'search', 'homepage', 'direct'
  user_id VARCHAR(255),
  session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_impressions_vehicle ON impressions(vehicle_id);
CREATE INDEX idx_impressions_created ON impressions(created_at);

-- Feed sync logs
CREATE TABLE feed_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sync_timestamp TIMESTAMP DEFAULT NOW(),
  vehicles_added INT DEFAULT 0,
  vehicles_updated INT DEFAULT 0,
  vehicles_removed INT DEFAULT 0,
  total_vehicles INT,
  duration_seconds INT,
  status VARCHAR(20) DEFAULT 'success', -- success, partial, failed
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_sync_timestamp ON feed_sync_logs(sync_timestamp);

-- Function to increment vehicle impressions
CREATE OR REPLACE FUNCTION increment_impressions()
RETURNS TRIGGER AS $$
BEGIN
  -- This can be used if we want to track impression count on vehicles table
  -- For now, we just log to impressions table
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) Policies
-- Public can read vehicles
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active vehicles"
  ON vehicles FOR SELECT
  USING (is_active = true);

-- Only service role can modify vehicles
CREATE POLICY "Service role can manage vehicles"
  ON vehicles FOR ALL
  USING (auth.role() = 'service_role');

-- Clicks and impressions: insert only
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert clicks"
  ON clicks FOR INSERT
  WITH CHECK (true);

ALTER TABLE impressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can insert impressions"
  ON impressions FOR INSERT
  WITH CHECK (true);

-- Dealer click history: insert/update only
ALTER TABLE dealer_click_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can manage dealer history"
  ON dealer_click_history FOR ALL
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE vehicles IS 'Main inventory of vehicles from LotLinx feed';
COMMENT ON TABLE clicks IS 'Tracks all click-throughs to dealer VDPs with deduplication';
COMMENT ON TABLE dealer_click_history IS 'Tracks unique dealer clicks per user (30-day window) for revenue calculation';
COMMENT ON TABLE impressions IS 'Tracks vehicle page views for CTR calculation';
COMMENT ON COLUMN clicks.is_billable IS 'TRUE if this is first click to this dealer by this user in 30 days ($0.80 revenue)';
COMMENT ON COLUMN vehicles.dealer_id IS 'LotLinx dealer ID - critical for revenue deduplication';
