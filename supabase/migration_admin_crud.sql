-- ======================================================
-- Migration: Admin CRUD — Delete User Policy
-- Run this in Supabase SQL Editor
-- ======================================================

-- 1. Add DELETE policy on public.users for admin
DROP POLICY IF EXISTS "Admin can delete users" ON public.users;
CREATE POLICY "Admin can delete users"
  ON public.users FOR DELETE
  USING (public.is_admin());

-- 2. Add DELETE policies on user_enrollments for admin
DROP POLICY IF EXISTS "Admin can delete enrollments" ON public.user_enrollments;
CREATE POLICY "Admin can delete enrollments"
  ON public.user_enrollments FOR DELETE
  USING (public.is_admin());

-- 3. Add DELETE policies on user_achievements for admin
DROP POLICY IF EXISTS "Admin can delete achievements" ON public.user_achievements;
CREATE POLICY "Admin can delete achievements"
  ON public.user_achievements FOR DELETE
  USING (public.is_admin());

-- 4. Add DELETE policies on student_submissions for admin
DROP POLICY IF EXISTS "Admin can delete submissions" ON public.student_submissions;
CREATE POLICY "Admin can delete submissions"
  ON public.student_submissions FOR DELETE
  USING (public.is_admin());

-- 5. Add INSERT policy on users for admin (to create users)
DROP POLICY IF EXISTS "Admin can insert users" ON public.users;
CREATE POLICY "Admin can insert users"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id OR public.is_admin());

-- ======================================================
-- DONE! Admin can now fully manage users (CRUD).
-- ======================================================
