-- Create university_details_cache table for caching university information
CREATE TABLE IF NOT EXISTS university_details_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  university_name TEXT NOT NULL,
  country_name TEXT NOT NULL,
  university_image_url TEXT,
  description TEXT,
  world_ranking TEXT,
  application_fee TEXT,
  application_requirements JSONB DEFAULT '[]'::jsonb,
  programs JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(university_name, country_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_university_details_cache_lookup 
ON university_details_cache(university_name, country_name);

-- Create index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_university_details_cache_updated 
ON university_details_cache(updated_at);
