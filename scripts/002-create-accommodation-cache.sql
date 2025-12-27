-- Create accommodation cache table
CREATE TABLE IF NOT EXISTS accommodation_cache (
  id SERIAL PRIMARY KEY,
  university_name TEXT NOT NULL,
  country_name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  UNIQUE(university_name, country_name)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_accommodation_cache_lookup
ON accommodation_cache(university_name, country_name, expires_at);
