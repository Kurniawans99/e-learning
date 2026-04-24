-- ======================================================
-- Migration: Role-Based Access Control (RBAC)
-- Run this in Supabase SQL Editor
-- ======================================================

-- 1. Add 'role' column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'student' 
CHECK (role IN ('admin', 'teacher', 'student'));

-- 2. Add 'user_id' to instructors table (link teacher account)
ALTER TABLE public.instructors 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Update RLS policies for users table
-- Allow admin to read all users
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own or admin view all"
  ON public.users FOR SELECT
  USING (
    auth.uid() = id 
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Allow admin to update any user
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own or admin update all"
  ON public.users FOR UPDATE
  USING (
    auth.uid() = id 
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- Keep insert policy
-- (already exists from previous migration)

-- 4. Update RLS policies for courses - allow teacher/admin to manage
DROP POLICY IF EXISTS "Allow public read access to courses" ON public.courses;
CREATE POLICY "Allow public read access to courses" 
  ON public.courses FOR SELECT USING (true);

CREATE POLICY "Teachers can insert own courses"
  ON public.courses FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin')
    )
  );

CREATE POLICY "Teachers can update own courses"
  ON public.courses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.instructors WHERE id = instructor_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Teachers can delete own courses"
  ON public.courses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.instructors WHERE id = instructor_id AND user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5. Allow teacher/admin to manage course sub-tables
-- course_tags
CREATE POLICY "Teachers/Admin can insert tags"
  ON public.course_tags FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

CREATE POLICY "Teachers/Admin can delete tags"
  ON public.course_tags FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- course_outcomes
CREATE POLICY "Teachers/Admin can insert outcomes"
  ON public.course_outcomes FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

CREATE POLICY "Teachers/Admin can delete outcomes"
  ON public.course_outcomes FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- curriculum_sections
CREATE POLICY "Teachers/Admin can insert sections"
  ON public.curriculum_sections FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

CREATE POLICY "Teachers/Admin can delete sections"
  ON public.curriculum_sections FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- lessons
CREATE POLICY "Teachers/Admin can insert lessons"
  ON public.lessons FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

CREATE POLICY "Teachers/Admin can delete lessons"
  ON public.lessons FOR DELETE
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- 6. Allow teacher/admin to manage instructors
CREATE POLICY "Teachers/Admin can insert instructors"
  ON public.instructors FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

CREATE POLICY "Teachers/Admin can update own instructor"
  ON public.instructors FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 7. Allow admin to view all enrollments (for analytics)
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.user_enrollments;
CREATE POLICY "Users view own or teacher/admin view"
  ON public.user_enrollments FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin'))
  );

-- 8. Allow admin to view all achievements
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users view own or admin view all"
  ON public.user_achievements FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
  );

-- ======================================================
-- ASSIGN ROLES TO EXISTING USERS
-- 
-- IMPORTANT: Use INSERT ... ON CONFLICT (upsert) instead
-- of UPDATE, because a user may not yet have a row in 
-- public.users (the row is only created when they visit 
-- the dashboard or save their profile).
--
-- Replace 'YOUR_EMAIL@example.com' with actual email.
-- ======================================================

-- Make a user Admin:
-- INSERT INTO public.users (id, role)
-- SELECT id, 'admin' FROM auth.users WHERE email = 'YOUR_EMAIL@example.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Make a user Teacher:
-- INSERT INTO public.users (id, role)
-- SELECT id, 'teacher' FROM auth.users WHERE email = 'YOUR_EMAIL@example.com'
-- ON CONFLICT (id) DO UPDATE SET role = 'teacher';
