-- Create professional_visa_requirements_cache table
CREATE TABLE IF NOT EXISTS professional_visa_requirements_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT NOT NULL,
  nationality TEXT NOT NULL DEFAULT 'Pakistani',
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE(country_name, nationality)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_professional_visa_cache_country ON professional_visa_requirements_cache(country_name);
