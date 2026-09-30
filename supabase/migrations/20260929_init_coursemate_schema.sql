-- CourseMate Cloud Schema & Cross-Device Sync Engine
-- Multi-Tenant PostgreSQL Schema with Row-Level Security (RLS)

-- Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Linked to Supabase Auth Users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  selected_university TEXT NOT NULL DEFAULT 'ISBAT University',
  xp_points INT DEFAULT 1240,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Student Academic Records Table (Scraped Bio-Data, GPA & PRN Ledger)
CREATE TABLE IF NOT EXISTS public.student_academic_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  university TEXT NOT NULL DEFAULT 'ISBAT University',
  student_name TEXT NOT NULL,
  preferred_name TEXT,
  student_id TEXT NOT NULL,
  reg_number TEXT NOT NULL,
  faculty TEXT,
  programme TEXT,
  semester_name TEXT DEFAULT 'Year One - Semester Two',
  academic_status TEXT DEFAULT 'Active',
  year INT DEFAULT 1,
  semester INT DEFAULT 2,
  current_gpa NUMERIC(4, 2) DEFAULT 4.25,
  study_streak_days INT DEFAULT 8,
  weekly_study_hours_goal NUMERIC(4, 1) DEFAULT 20.0,
  weekly_study_hours_logged NUMERIC(4, 1) DEFAULT 14.5,
  fee_summary JSONB DEFAULT '{}'::jsonb,
  is_synced BOOLEAN DEFAULT true,
  last_synced_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_profile_university UNIQUE (profile_id, university)
);

-- 3. Enrolled Courses Table (Scraped Modules, Lecturers & Exam Dates)
CREATE TABLE IF NOT EXISTS public.enrolled_courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  university TEXT NOT NULL DEFAULT 'ISBAT University',
  course_code TEXT NOT NULL,
  course_title TEXT NOT NULL,
  credit_units INT DEFAULT 3,
  lecturer TEXT,
  room TEXT,
  color TEXT DEFAULT '#8B5CF6',
  next_class TEXT,
  progress_pct INT DEFAULT 50,
  grade_estimate TEXT DEFAULT 'In Progress',
  upcoming_assignments INT DEFAULT 1,
  upcoming_tests INT DEFAULT 0,
  materials_count INT DEFAULT 12,
  syllabus_topics JSONB DEFAULT '[]'::jsonb,
  timetable JSONB DEFAULT '{}'::jsonb,
  assessments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_profile_course UNIQUE (profile_id, university, course_code)
);

-- 4. Flashcard Decks Table (Gemini AI Study Material & Retention)
CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  university TEXT NOT NULL DEFAULT 'ISBAT University',
  course_code TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'Concept Review',
  flashcards JSONB NOT NULL DEFAULT '[]'::jsonb,
  cards_count INT DEFAULT 0,
  mastered_count INT DEFAULT 0,
  last_reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tasks and Study Deadlines Table (Personal Planner Items)
CREATE TABLE IF NOT EXISTS public.tasks_and_deadlines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  university TEXT NOT NULL DEFAULT 'ISBAT University',
  course_code TEXT,
  title TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  location TEXT,
  type TEXT NOT NULL DEFAULT 'assignment',
  completed BOOLEAN DEFAULT false,
  urgency_text TEXT,
  due_time TEXT,
  weight_pct INT DEFAULT 15,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for performant cross-tenant and user lookups
CREATE INDEX IF NOT EXISTS idx_academic_records_profile ON public.student_academic_records(profile_id);
CREATE INDEX IF NOT EXISTS idx_enrolled_courses_profile ON public.enrolled_courses(profile_id, university);
CREATE INDEX IF NOT EXISTS idx_flashcards_profile ON public.flashcard_decks(profile_id, course_code);
CREATE INDEX IF NOT EXISTS idx_tasks_profile ON public.tasks_and_deadlines(profile_id, date);

-- Enable Row-Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_academic_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrolled_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks_and_deadlines ENABLE ROW LEVEL SECURITY;

-- 1. Profiles RLS Policies
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. Academic Records RLS Policies
CREATE POLICY "Users can view own academic records"
  ON public.student_academic_records FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can insert/update own academic records"
  ON public.student_academic_records FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- 3. Enrolled Courses RLS Policies
CREATE POLICY "Users can view own enrolled courses"
  ON public.enrolled_courses FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can manage own enrolled courses"
  ON public.enrolled_courses FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- 4. Flashcard Decks RLS Policies
CREATE POLICY "Users can view own flashcards"
  ON public.flashcard_decks FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can manage own flashcards"
  ON public.flashcard_decks FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- 5. Tasks and Deadlines RLS Policies
CREATE POLICY "Users can view own tasks"
  ON public.tasks_and_deadlines FOR SELECT
  USING (auth.uid() = profile_id);

CREATE POLICY "Users can manage own tasks"
  ON public.tasks_and_deadlines FOR ALL
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);
