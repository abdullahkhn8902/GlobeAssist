-- Add avatar_url column to user_profiles for profile picture storage
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add a comment to document the change
COMMENT ON COLUMN user_profiles.avatar_url IS 'URL to user profile picture stored in Supabase storage';
