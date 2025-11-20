-- Add marketing parameters to clicks table
ALTER TABLE clicks
  ADD COLUMN ttclid TEXT,
  ADD COLUMN tblci TEXT,
  ADD COLUMN utm_term TEXT,
  ADD COLUMN utm_content TEXT;

-- Add marketing parameters to impressions table
ALTER TABLE impressions
  ADD COLUMN ttclid TEXT,
  ADD COLUMN tblci TEXT,
  ADD COLUMN utm_term TEXT,
  ADD COLUMN utm_content TEXT;

-- Add indexes for new columns to support analytics queries
CREATE INDEX idx_clicks_ttclid ON clicks(ttclid) WHERE ttclid IS NOT NULL;
CREATE INDEX idx_clicks_tblci ON clicks(tblci) WHERE tblci IS NOT NULL;
CREATE INDEX idx_clicks_utm_term ON clicks(utm_term) WHERE utm_term IS NOT NULL;
CREATE INDEX idx_clicks_utm_content ON clicks(utm_content) WHERE utm_content IS NOT NULL;

CREATE INDEX idx_impressions_ttclid ON impressions(ttclid) WHERE ttclid IS NOT NULL;
CREATE INDEX idx_impressions_tblci ON impressions(tblci) WHERE tblci IS NOT NULL;
CREATE INDEX idx_impressions_utm_term ON impressions(utm_term) WHERE utm_term IS NOT NULL;
CREATE INDEX idx_impressions_utm_content ON impressions(utm_content) WHERE utm_content IS NOT NULL;