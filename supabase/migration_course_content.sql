-- ======================================================
-- Migration: Course Content & Assessment System
-- Run this in Supabase SQL Editor
-- 
-- IMPORTANT: Run fix_rls_recursion.sql FIRST so that
-- the helper functions is_admin() and is_teacher_or_admin()
-- already exist before running this file.
-- ======================================================

-- 1. Extend curriculum_sections with description
ALTER TABLE public.curriculum_sections 
ADD COLUMN IF NOT EXISTS description TEXT;

-- 2. Section Contents — rich media per section
CREATE TABLE IF NOT EXISTS public.section_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID REFERENCES public.curriculum_sections(id) ON DELETE CASCADE NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('video', 'image', 'text', 'document')),
  title TEXT NOT NULL,
  description TEXT,
  content_url TEXT,           -- URL from Supabase Storage (video/image/doc)
  content_text TEXT,          -- for 'text' type (rich text / markdown)
  duration TEXT,              -- for video (e.g. '12:30')
  file_size BIGINT DEFAULT 0, -- file size in bytes
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Assessments — linked to course + optional section
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES public.curriculum_sections(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  assessment_type TEXT NOT NULL CHECK (assessment_type IN ('quiz', 'essay', 'file_upload', 'interview')),
  time_limit_minutes INTEGER,         -- null = unlimited
  passing_score INTEGER DEFAULT 60,   -- min score 0-100
  max_attempts INTEGER DEFAULT 1,
  is_published BOOLEAN DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Assessment Questions
CREATE TABLE IF NOT EXISTS public.assessment_questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'essay', 'file_upload')),
  points INTEGER NOT NULL DEFAULT 1,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Question Options (for multiple choice)
CREATE TABLE IF NOT EXISTS public.question_options (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  question_id UUID REFERENCES public.assessment_questions(id) ON DELETE CASCADE NOT NULL,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  "order" INTEGER NOT NULL DEFAULT 0
);

-- 6. Student Submissions
CREATE TABLE IF NOT EXISTS public.student_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'graded')),
  score INTEGER,
  feedback TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(assessment_id, student_id)
);

-- 7. Submission Answers
CREATE TABLE IF NOT EXISTS public.submission_answers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES public.student_submissions(id) ON DELETE CASCADE NOT NULL,
  question_id UUID REFERENCES public.assessment_questions(id) ON DELETE CASCADE NOT NULL,
  selected_option_id UUID REFERENCES public.question_options(id) ON DELETE SET NULL,
  answer_text TEXT,          -- for essay answers
  file_url TEXT,             -- for file upload answers
  is_correct BOOLEAN,
  points_earned INTEGER DEFAULT 0
);

-- 8. Interview Schedules
CREATE TABLE IF NOT EXISTS public.interview_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  meeting_url TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
  notes TEXT,
  teacher_notes TEXT,
  score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(assessment_id, student_id)
);

-- ======================================================
-- INDEXES for performance
-- ======================================================
CREATE INDEX IF NOT EXISTS idx_section_contents_section ON public.section_contents(section_id, "order");
CREATE INDEX IF NOT EXISTS idx_assessments_course ON public.assessments(course_id, "order");
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment ON public.assessment_questions(assessment_id, "order");
CREATE INDEX IF NOT EXISTS idx_question_options_question ON public.question_options(question_id, "order");
CREATE INDEX IF NOT EXISTS idx_student_submissions_student ON public.student_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_student_submissions_assessment ON public.student_submissions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_submission_answers_submission ON public.submission_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_assessment ON public.interview_schedules(assessment_id);

-- ======================================================
-- ENABLE ROW LEVEL SECURITY
-- ======================================================
ALTER TABLE public.section_contents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;

-- ======================================================
-- RLS POLICIES — section_contents
-- Uses is_teacher_or_admin() to avoid recursion!
-- ======================================================
DROP POLICY IF EXISTS "Public can read section contents" ON public.section_contents;
DROP POLICY IF EXISTS "Teachers can insert section contents" ON public.section_contents;
DROP POLICY IF EXISTS "Teachers can update section contents" ON public.section_contents;
DROP POLICY IF EXISTS "Teachers can delete section contents" ON public.section_contents;

CREATE POLICY "Public can read section contents"
  ON public.section_contents FOR SELECT USING (true);

CREATE POLICY "Teachers can insert section contents"
  ON public.section_contents FOR INSERT
  WITH CHECK (public.is_teacher_or_admin());

CREATE POLICY "Teachers can update section contents"
  ON public.section_contents FOR UPDATE
  USING (public.is_teacher_or_admin());

CREATE POLICY "Teachers can delete section contents"
  ON public.section_contents FOR DELETE
  USING (public.is_teacher_or_admin());

-- ======================================================
-- RLS POLICIES — assessments
-- ======================================================
DROP POLICY IF EXISTS "Public can read published assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can insert assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can update assessments" ON public.assessments;
DROP POLICY IF EXISTS "Teachers can delete assessments" ON public.assessments;

CREATE POLICY "Public can read published assessments"
  ON public.assessments FOR SELECT
  USING (is_published = true OR public.is_teacher_or_admin());

CREATE POLICY "Teachers can insert assessments"
  ON public.assessments FOR INSERT
  WITH CHECK (public.is_teacher_or_admin());

CREATE POLICY "Teachers can update assessments"
  ON public.assessments FOR UPDATE
  USING (public.is_teacher_or_admin());

CREATE POLICY "Teachers can delete assessments"
  ON public.assessments FOR DELETE
  USING (public.is_teacher_or_admin());

-- ======================================================
-- RLS POLICIES — assessment_questions
-- ======================================================
DROP POLICY IF EXISTS "Public can read questions of published assessments" ON public.assessment_questions;
DROP POLICY IF EXISTS "Teachers can insert questions" ON public.assessment_questions;
DROP POLICY IF EXISTS "Teachers can update questions" ON public.assessment_questions;
DROP POLICY IF EXISTS "Teachers can delete questions" ON public.assessment_questions;

CREATE POLICY "Public can read questions"
  ON public.assessment_questions FOR SELECT USING (true);

CREATE POLICY "Teachers can insert questions"
  ON public.assessment_questions FOR INSERT
  WITH CHECK (public.is_teacher_or_admin());

CREATE POLICY "Teachers can update questions"
  ON public.assessment_questions FOR UPDATE
  USING (public.is_teacher_or_admin());

CREATE POLICY "Teachers can delete questions"
  ON public.assessment_questions FOR DELETE
  USING (public.is_teacher_or_admin());

-- ======================================================
-- RLS POLICIES — question_options
-- ======================================================
DROP POLICY IF EXISTS "Public can read question options" ON public.question_options;
DROP POLICY IF EXISTS "Teachers can insert options" ON public.question_options;
DROP POLICY IF EXISTS "Teachers can update options" ON public.question_options;
DROP POLICY IF EXISTS "Teachers can delete options" ON public.question_options;

CREATE POLICY "Public can read question options"
  ON public.question_options FOR SELECT USING (true);

CREATE POLICY "Teachers can insert options"
  ON public.question_options FOR INSERT
  WITH CHECK (public.is_teacher_or_admin());

CREATE POLICY "Teachers can update options"
  ON public.question_options FOR UPDATE
  USING (public.is_teacher_or_admin());

CREATE POLICY "Teachers can delete options"
  ON public.question_options FOR DELETE
  USING (public.is_teacher_or_admin());

-- ======================================================
-- RLS POLICIES — student_submissions
-- ======================================================
DROP POLICY IF EXISTS "Students can view own submissions" ON public.student_submissions;
DROP POLICY IF EXISTS "Students can insert own submissions" ON public.student_submissions;
DROP POLICY IF EXISTS "Students can update own in-progress submissions" ON public.student_submissions;

CREATE POLICY "Students can view own submissions"
  ON public.student_submissions FOR SELECT
  USING (auth.uid() = student_id OR public.is_teacher_or_admin());

CREATE POLICY "Students can insert own submissions"
  ON public.student_submissions FOR INSERT
  WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Students can update own in-progress submissions"
  ON public.student_submissions FOR UPDATE
  USING (
    (auth.uid() = student_id AND status = 'in_progress')
    OR public.is_teacher_or_admin()
  );

-- ======================================================
-- RLS POLICIES — submission_answers
-- ======================================================
DROP POLICY IF EXISTS "Students can view own answers" ON public.submission_answers;
DROP POLICY IF EXISTS "Students can insert own answers" ON public.submission_answers;
DROP POLICY IF EXISTS "Students can update own answers" ON public.submission_answers;

CREATE POLICY "Students can view own answers"
  ON public.submission_answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.student_submissions 
      WHERE id = submission_answers.submission_id 
      AND (student_id = auth.uid() OR public.is_teacher_or_admin())
    )
  );

CREATE POLICY "Students can insert own answers"
  ON public.submission_answers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.student_submissions 
      WHERE id = submission_answers.submission_id 
      AND student_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own answers"
  ON public.submission_answers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.student_submissions 
      WHERE id = submission_answers.submission_id 
      AND (student_id = auth.uid() OR public.is_teacher_or_admin())
    )
  );

-- ======================================================
-- RLS POLICIES — interview_schedules
-- ======================================================
DROP POLICY IF EXISTS "Users can view own interview or teacher view all" ON public.interview_schedules;
DROP POLICY IF EXISTS "Teachers can insert interview schedules" ON public.interview_schedules;
DROP POLICY IF EXISTS "Teachers can update interview schedules" ON public.interview_schedules;
DROP POLICY IF EXISTS "Teachers can delete interview schedules" ON public.interview_schedules;

CREATE POLICY "Users can view own interview or teacher view all"
  ON public.interview_schedules FOR SELECT
  USING (auth.uid() = student_id OR public.is_teacher_or_admin());

CREATE POLICY "Teachers can insert interview schedules"
  ON public.interview_schedules FOR INSERT
  WITH CHECK (public.is_teacher_or_admin());

CREATE POLICY "Teachers can update interview schedules"
  ON public.interview_schedules FOR UPDATE
  USING (public.is_teacher_or_admin());

CREATE POLICY "Teachers can delete interview schedules"
  ON public.interview_schedules FOR DELETE
  USING (public.is_teacher_or_admin());

-- ======================================================
-- FIX curriculum_sections update policy (also needs helper)
-- ======================================================
DROP POLICY IF EXISTS "Teachers can update sections" ON public.curriculum_sections;
CREATE POLICY "Teachers can update sections"
  ON public.curriculum_sections FOR UPDATE
  USING (public.is_teacher_or_admin());
