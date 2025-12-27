-- Create table to store detailed country information
CREATE TABLE IF NOT EXISTS country_details (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_name TEXT NOT NULL UNIQUE,
  description TEXT,
  landmark_image_url TEXT,
  visa_processing_time TEXT,
  language TEXT,
  intakes TEXT,
  popular_scholarships JSONB DEFAULT '[]'::jsonb,
  universities JSONB DEFAULT '[]'::jsonb,
  other_info JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_country_details_name ON country_details(country_name);

-- Enable RLS
ALTER TABLE country_details ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to view country details (shared data)
CREATE POLICY "Anyone can view country details"
  ON country_details
  FOR SELECT
  TO authenticated
  USING (true);

-- Only allow service role to insert/update (API will handle this)
CREATE POLICY "Service role can insert country details"
  ON country_details
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update country details"
  ON country_details
  FOR UPDATE
  TO service_role
  USING (true);
