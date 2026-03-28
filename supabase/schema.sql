-- Users Table (Extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  full_name TEXT,
  avatar_url TEXT,
  headline TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Instructors Table
CREATE TABLE IF NOT EXISTS public.instructors (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  student_count INTEGER DEFAULT 0,
  course_count INTEGER DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0.0,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Courses Table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL,
  category TEXT NOT NULL,
  level TEXT NOT NULL,
  price NUMERIC(10, 2) NOT NULL,
  original_price NUMERIC(10, 2) NOT NULL,
  rating NUMERIC(3, 2) DEFAULT 0.0,
  review_count INTEGER DEFAULT 0,
  student_count INTEGER DEFAULT 0,
  hours NUMERIC(5, 1) NOT NULL,
  module_count INTEGER NOT NULL,
  narrative TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  instructor_id UUID REFERENCES public.instructors(id) ON DELETE SET NULL
);

-- Course Tags
CREATE TABLE IF NOT EXISTS public.course_tags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  tag_name TEXT NOT NULL
);

-- Course Outcomes (What you'll master)
CREATE TABLE IF NOT EXISTS public.course_outcomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

-- Curriculum Sections
CREATE TABLE IF NOT EXISTS public.curriculum_sections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  "order" INTEGER NOT NULL
);

-- Curriculum Lessons
CREATE TABLE IF NOT EXISTS public.lessons (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES public.curriculum_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration TEXT NOT NULL, -- e.g., '12:45' or '10 mins'
  type TEXT NOT NULL CHECK (type IN ('video', 'quiz', 'project', 'reading')),
  is_locked BOOLEAN DEFAULT false,
  "order" INTEGER NOT NULL
);

-- Testimonials (Landing Page)
CREATE TABLE IF NOT EXISTS public.testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  avatar_initials TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Course Reviews
CREATE TABLE IF NOT EXISTS public.course_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  reviewer_name TEXT NOT NULL,
  avatar_initials TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.curriculum_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all catalog tables
CREATE POLICY "Allow public read access to courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Allow public read access to instructors" ON public.instructors FOR SELECT USING (true);
CREATE POLICY "Allow public read access to course_tags" ON public.course_tags FOR SELECT USING (true);
CREATE POLICY "Allow public read access to course_outcomes" ON public.course_outcomes FOR SELECT USING (true);
CREATE POLICY "Allow public read access to curriculum_sections" ON public.curriculum_sections FOR SELECT USING (true);
CREATE POLICY "Allow public read access to lessons" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "Allow public read access to testimonials" ON public.testimonials FOR SELECT USING (true);
CREATE POLICY "Allow public read access to course_reviews" ON public.course_reviews FOR SELECT USING (true);
