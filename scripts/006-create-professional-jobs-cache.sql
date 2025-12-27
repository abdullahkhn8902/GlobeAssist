-- Create professional_jobs_cache table to store fetched job listings
CREATE TABLE IF NOT EXISTS professional_jobs_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  country_name TEXT NOT NULL,
  jobs JSONB NOT NULL DEFAULT '[]',
  country_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  UNIQUE(user_id, country_name)
);

-- Enable RLS
ALTER TABLE professional_jobs_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own jobs cache"
  ON professional_jobs_cache FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own jobs cache"
  ON professional_jobs_cache FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own jobs cache"
  ON professional_jobs_cache FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own jobs cache"
  ON professional_jobs_cache FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_professional_jobs_cache_user_country ON professional_jobs_cache(user_id, country_name);
