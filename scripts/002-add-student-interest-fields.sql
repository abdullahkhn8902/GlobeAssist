-- Add fields_of_interest and why_this_field columns to student_profiles table
ALTER TABLE student_profiles
ADD COLUMN IF NOT EXISTS fields_of_interest text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS why_this_field text DEFAULT '';
