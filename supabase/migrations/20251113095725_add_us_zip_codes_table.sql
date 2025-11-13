-- Add US ZIP codes reference table for geographic targeting
-- Used to generate ZIP code lists for Google Ads targeting

CREATE TABLE IF NOT EXISTS us_zip_codes (
  zip_code VARCHAR(5) PRIMARY KEY,
  city VARCHAR(100),
  state VARCHAR(2),
  latitude DECIMAL(10,7) NOT NULL,
  longitude DECIMAL(10,7) NOT NULL,
  population INT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for geographic queries (find ZIPs within radius)
CREATE INDEX IF NOT EXISTS idx_us_zip_codes_location
  ON us_zip_codes USING GIST (
    CAST(ST_MakePoint(longitude, latitude) AS geography)
  );

-- Index for state-based queries
CREATE INDEX IF NOT EXISTS idx_us_zip_codes_state
  ON us_zip_codes(state);

COMMENT ON TABLE us_zip_codes IS 'US ZIP codes with lat/long for Google Ads targeting exports';
COMMENT ON COLUMN us_zip_codes.zip_code IS 'Five-digit ZIP code (primary key)';
COMMENT ON COLUMN us_zip_codes.latitude IS 'ZIP code centroid latitude';
COMMENT ON COLUMN us_zip_codes.longitude IS 'ZIP code centroid longitude';
COMMENT ON COLUMN us_zip_codes.population IS 'Approximate population (optional, for prioritization)';
