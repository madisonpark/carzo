-- Add marketing parameters to clicks table
ALTER TABLE clicks
  ADD COLUMN ttclid TEXT,
  ADD COLUMN tblci TEXT;

-- Add marketing parameters to impressions table
ALTER TABLE impressions
  ADD COLUMN ttclid TEXT,
  ADD COLUMN tblci TEXT;

-- Add indexes for new columns to support analytics queries
CREATE INDEX idx_clicks_ttclid ON clicks(ttclid) WHERE ttclid IS NOT NULL;
CREATE INDEX idx_clicks_tblci ON clicks(tblci) WHERE tblci IS NOT NULL;
