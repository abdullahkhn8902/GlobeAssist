-- Create job_recommendations table for professional users
CREATE TABLE IF NOT EXISTS job_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_name TEXT NOT NULL,
  image_url TEXT,
  job_count INTEGER DEFAULT 0,
  cost_of_living_min INTEGER DEFAULT 0,
  cost_of_living_max INTEGER DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, country_name)
);

-- Enable RLS
ALTER TABLE job_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own job recommendations"
  ON job_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own job recommendations"
  ON job_recommendations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own job recommendations"
  ON job_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own job recommendations"
  ON job_recommendations FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_job_recommendations_user_id ON job_recommendations(user_id);
