-- Add preferred destination and budget fields to professional_profiles table
ALTER TABLE professional_profiles
ADD COLUMN IF NOT EXISTS preferred_destination TEXT,
ADD COLUMN IF NOT EXISTS budget_min INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS budget_max INTEGER DEFAULT 10000;

-- Add a comment to document the change
COMMENT ON COLUMN professional_profiles.preferred_destination IS 'Preferred country/region for studying abroad';
COMMENT ON COLUMN professional_profiles.budget_min IS 'Minimum budget in USD for studying abroad';
COMMENT ON COLUMN professional_profiles.budget_max IS 'Maximum budget in USD for studying abroad';
