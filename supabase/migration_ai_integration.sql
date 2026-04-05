-- ======================================================
-- Migration: AI Integration (user_preferences, ai_chat_messages)
-- Run this in Supabase SQL Editor
-- ======================================================

-- User Preferences (onboarding results)
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  specializations TEXT[] NOT NULL DEFAULT '{}',
  experience_level TEXT NOT NULL DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  goals TEXT[] NOT NULL DEFAULT '{}',
  known_languages TEXT[] NOT NULL DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT true,
  ai_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AI Chat Messages
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for faster chat history queries
CREATE INDEX IF NOT EXISTS idx_chat_messages_user ON public.ai_chat_messages(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chat_messages_course ON public.ai_chat_messages(user_id, course_id, created_at DESC);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS: user_preferences
CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- RLS: ai_chat_messages  
CREATE POLICY "Users can view own chat"
  ON public.ai_chat_messages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chat"
  ON public.ai_chat_messages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own chat"
  ON public.ai_chat_messages FOR DELETE USING (auth.uid() = user_id);
