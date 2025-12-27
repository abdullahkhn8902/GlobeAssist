-- Create scholarships cache table for storing fetched scholarship data
CREATE TABLE IF NOT EXISTS scholarships_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cache_key TEXT UNIQUE NOT NULL,
  scholarships JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days'
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_scholarships_cache_key ON scholarships_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_scholarships_expires ON scholarships_cache(expires_at);
