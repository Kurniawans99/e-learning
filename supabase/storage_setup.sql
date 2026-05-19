-- ======================================================
-- Supabase Storage Setup: course-content bucket
-- Run this in Supabase SQL Editor
-- 
-- IMPORTANT: Run fix_rls_recursion.sql FIRST so that
-- the helper functions exist before running this file.
-- ======================================================

-- Create storage bucket for course content files (video, image, documents)
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-content', 'course-content', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for student submission files
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-submissions', 'student-submissions', false)
ON CONFLICT (id) DO NOTHING;

-- ======================================================
-- STORAGE POLICIES — course-content (public read, teacher write)
-- Uses is_teacher_or_admin() to avoid recursion!
-- ======================================================

-- Drop existing policies first (safe to re-run)
DROP POLICY IF EXISTS "Public can view course content" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can upload course content" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can update course content" ON storage.objects;
DROP POLICY IF EXISTS "Teachers can delete course content" ON storage.objects;
DROP POLICY IF EXISTS "Users can view submission files" ON storage.objects;
DROP POLICY IF EXISTS "Students can upload submissions" ON storage.objects;

-- Anyone can view course content files
CREATE POLICY "Public can view course content"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'course-content');

-- Teachers/Admin can upload files
CREATE POLICY "Teachers can upload course content"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'course-content'
    AND public.is_teacher_or_admin()
  );

-- Teachers/Admin can update files
CREATE POLICY "Teachers can update course content"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'course-content'
    AND public.is_teacher_or_admin()
  );

-- Teachers/Admin can delete files
CREATE POLICY "Teachers can delete course content"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'course-content'
    AND public.is_teacher_or_admin()
  );

-- ======================================================
-- STORAGE POLICIES — student-submissions (student write, teacher read)
-- ======================================================

-- Students can view own submission files, teachers can view all
CREATE POLICY "Users can view submission files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'student-submissions'
    AND (
      (auth.uid()::text = (storage.foldername(name))[1])
      OR public.is_teacher_or_admin()
    )
  );

-- Students can upload submission files (in their own folder)
CREATE POLICY "Students can upload submissions"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'student-submissions'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
