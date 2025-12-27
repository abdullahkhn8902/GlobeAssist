-- Create avatars storage bucket
-- Note: This needs to be run in Supabase SQL editor or via storage API
-- The bucket creation is typically done via Supabase dashboard or client

-- Create policy to allow users to upload their own avatars
-- This is for reference - actual bucket creation should be done via Supabase dashboard

-- Storage policies for avatars bucket:
-- 1. Allow authenticated users to upload to their own folder
-- 2. Allow public read access for avatars

-- To create the bucket manually in Supabase:
-- 1. Go to Storage in Supabase dashboard
-- 2. Create a new bucket called "avatars"
-- 3. Make it public for read access
-- 4. Add policy: authenticated users can insert/update in avatars/*
