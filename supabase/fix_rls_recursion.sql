-- ======================================================
-- FIX: Infinite Recursion in RLS Policies
-- 
-- Problem: policies on public.users reference public.users
-- which causes infinite recursion.
-- 
-- Solution: Create SECURITY DEFINER helper functions
-- that bypass RLS when checking admin/teacher status.
-- 
-- Run this ENTIRE file in Supabase SQL Editor.
-- ======================================================

-- 1. Create helper functions (bypass RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_teacher_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role IN ('teacher', 'admin')
  );
$$;

-- 2. Fix users table policies (remove recursive ones)
DROP POLICY IF EXISTS "Users can view own or admin view all" ON public.users;
DROP POLICY IF EXISTS "Users can update own or admin update all" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;

-- Recreate non-recursive policies for users table
CREATE POLICY "Users can view own or admin view all"
  ON public.users FOR SELECT
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can update own or admin update all"
  ON public.users FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 3. Fix courses policies (replace recursive references)
DROP POLICY IF EXISTS "Teachers can insert own courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can update own courses" ON public.courses;
DROP POLICY IF EXISTS "Teachers can delete own courses" ON public.courses;

CREATE POLICY "Teachers can insert own courses"
  ON public.courses FOR INSERT
  WITH CHECK (public.is_teacher_or_admin());

CREATE POLICY "Teachers can update own courses"
  ON public.courses FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.instructors WHERE id = instructor_id AND user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Teachers can delete own courses"
  ON public.courses FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.instructors WHERE id = instructor_id AND user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- 4. Fix course sub-table policies
DROP POLICY IF EXISTS "Teachers/Admin can insert tags" ON public.course_tags;
DROP POLICY IF EXISTS "Teachers/Admin can delete tags" ON public.course_tags;
CREATE POLICY "Teachers/Admin can insert tags"
  ON public.course_tags FOR INSERT
  WITH CHECK (public.is_teacher_or_admin());
CREATE POLICY "Teachers/Admin can delete tags"
  ON public.course_tags FOR DELETE
  USING (public.is_teacher_or_admin());

DROP POLICY IF EXISTS "Teachers/Admin can insert outcomes" ON public.course_outcomes;
DROP POLICY IF EXISTS "Teachers/Admin can delete outcomes" ON public.course_outcomes;
CREATE POLICY "Teachers/Admin can insert outcomes"
  ON public.course_outcomes FOR INSERT
  WITH CHECK (public.is_teacher_or_admin());
CREATE POLICY "Teachers/Admin can delete outcomes"
  ON public.course_outcomes FOR DELETE
  USING (public.is_teacher_or_admin());

DROP POLICY IF EXISTS "Teachers/Admin can insert sections" ON public.curriculum_sections;
DROP POLICY IF EXISTS "Teachers/Admin can delete sections" ON public.curriculum_sections;
CREATE POLICY "Teachers/Admin can insert sections"
  ON public.curriculum_sections FOR INSERT
  WITH CHECK (public.is_teacher_or_admin());
CREATE POLICY "Teachers/Admin can delete sections"
  ON public.curriculum_sections FOR DELETE
  USING (public.is_teacher_or_admin());

DROP POLICY IF EXISTS "Teachers/Admin can insert lessons" ON public.lessons;
DROP POLICY IF EXISTS "Teachers/Admin can delete lessons" ON public.lessons;
CREATE POLICY "Teachers/Admin can insert lessons"
  ON public.lessons FOR INSERT
  WITH CHECK (public.is_teacher_or_admin());
CREATE POLICY "Teachers/Admin can delete lessons"
  ON public.lessons FOR DELETE
  USING (public.is_teacher_or_admin());

-- 5. Fix instructors policies
DROP POLICY IF EXISTS "Teachers/Admin can insert instructors" ON public.instructors;
DROP POLICY IF EXISTS "Teachers/Admin can update own instructor" ON public.instructors;
CREATE POLICY "Teachers/Admin can insert instructors"
  ON public.instructors FOR INSERT
  WITH CHECK (public.is_teacher_or_admin());
CREATE POLICY "Teachers/Admin can update own instructor"
  ON public.instructors FOR UPDATE
  USING (user_id = auth.uid() OR public.is_admin());

-- 6. Fix enrollments policy
DROP POLICY IF EXISTS "Users view own or teacher/admin view" ON public.user_enrollments;
DROP POLICY IF EXISTS "Users can view own enrollments" ON public.user_enrollments;
CREATE POLICY "Users view own or teacher/admin view"
  ON public.user_enrollments FOR SELECT
  USING (auth.uid() = user_id OR public.is_teacher_or_admin());

-- 7. Fix achievements policy
DROP POLICY IF EXISTS "Users view own or admin view all" ON public.user_achievements;
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
CREATE POLICY "Users view own or admin view all"
  ON public.user_achievements FOR SELECT
  USING (auth.uid() = user_id OR public.is_admin());

-- ======================================================
-- DONE! Refresh your browser after running this.
-- ======================================================
