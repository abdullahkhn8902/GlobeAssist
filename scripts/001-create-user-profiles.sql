-- Create user_profiles table for storing onboarding data
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  full_name TEXT,
  email TEXT,
  profile_type TEXT NOT NULL CHECK (profile_type IN ('student', 'professional', 'researcher', 'other')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create student_profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  -- Step 1
  latest_qualification TEXT,
  university_name TEXT,
  graduation_year INTEGER,
  grade_cgpa TEXT,
  currently_studying BOOLEAN DEFAULT FALSE,
  -- Step 2
  degree_to_pursue TEXT,
  preferred_destination TEXT,
  preferred_year_of_intake INTEGER,
  budget_min INTEGER DEFAULT 0,
  budget_max INTEGER DEFAULT 10000,
  apply_for_scholarships BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create professional_profiles table
CREATE TABLE IF NOT EXISTS professional_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  -- Step 1
  current_job_title TEXT,
  company_name TEXT,
  years_of_experience INTEGER,
  highest_qualification TEXT,
  industry_field TEXT,
  -- Step 2
  fields_of_interest TEXT[],
  why_this_field TEXT,
  -- Step 3 - CV data
  cv_file_url TEXT,
  cv_parsed_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE professional_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for student_profiles
CREATE POLICY "Students can view own profile" ON student_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own profile" ON student_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own profile" ON student_profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for professional_profiles
CREATE POLICY "Professionals can view own profile" ON professional_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Professionals can insert own profile" ON professional_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Professionals can update own profile" ON professional_profiles
  FOR UPDATE USING (auth.uid() = user_id);
