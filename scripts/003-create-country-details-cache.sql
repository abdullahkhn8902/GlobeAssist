-- Create table to cache country details from Perplexity
CREATE TABLE IF NOT EXISTS country_details_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_name TEXT UNIQUE NOT NULL,
  description TEXT,
  country_image_url TEXT,
  visa_processing_time TEXT,
  language TEXT,
  intakes TEXT,
  scholarships JSONB DEFAULT '[]',
  universities JSONB DEFAULT '[]',
  universities_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_country_details_cache_name ON country_details_cache(country_name);
CREATE INDEX IF NOT EXISTS idx_country_details_cache_unis_count ON country_details_cache(universities_count);

-- Enable RLS
ALTER TABLE country_details_cache ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read cached data
CREATE POLICY "Anyone can read country cache" ON country_details_cache
  FOR SELECT TO authenticated USING (true);

-- Allow all authenticated users to insert/update cache
CREATE POLICY "Anyone can update country cache" ON country_details_cache
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Anyone can upsert country cache" ON country_details_cache
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
