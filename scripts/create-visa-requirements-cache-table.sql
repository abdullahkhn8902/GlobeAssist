-- Create visa requirements cache table
CREATE TABLE IF NOT EXISTS visa_requirements_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_name TEXT NOT NULL,
  nationality TEXT NOT NULL DEFAULT 'Pakistani',
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(country_name, nationality)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_visa_requirements_lookup 
ON visa_requirements_cache(country_name, nationality, expires_at);
