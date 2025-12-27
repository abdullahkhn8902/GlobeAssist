-- Create table for caching program details
CREATE TABLE IF NOT EXISTS program_details_cache (
  id BIGSERIAL PRIMARY KEY,
  program_name TEXT NOT NULL,
  university_name TEXT NOT NULL,
  country_name TEXT NOT NULL,
  data JSONB NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(program_name, university_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_program_details_cache_lookup 
ON program_details_cache(program_name, university_name, expires_at);

-- Create index on expiration for cleanup
CREATE INDEX IF NOT EXISTS idx_program_details_cache_expires 
ON program_details_cache(expires_at);
