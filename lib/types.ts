// Core database types reflecting the tables in our schema

export type UserRole = 'admin' | 'teacher' | 'student';

export interface Course {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  level: string;
  price: number;
  original_price: number;
  rating: number;
  review_count: number;
  student_count: number;
  hours: number;
  module_count: number;
  narrative: string;
  created_at: string;
  instructor_id: string;
  // Joined fields via select()
  instructor?: Instructor;
  tags?: CourseTag[];
  outcomes?: CourseOutcome[];
  sections?: CurriculumSection[];
  reviews?: CourseReview[];
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  bio: string | null;
  student_count: number;
  course_count: number;
  rating: number;
  avatar_url: string | null;
  user_id: string | null;
}

export interface CourseTag {
  id: string;
  tag_name: string;
}

export interface CourseOutcome {
  id: string;
  description: string;
  order: number;
}

export interface CurriculumSection {
  id: string;
  title: string;
  description?: string;
  order: number;
  lessons?: Lesson[];
  contents?: SectionContent[];
  assessments?: Assessment[];
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: "video" | "quiz" | "project" | "reading";
  is_locked: boolean;
  order: number;
}

export interface SectionContent {
  id: string;
  section_id: string;
  content_type: "video" | "image" | "text" | "document";
  title: string;
  description: string | null;
  content_url: string | null;
  content_text: string | null;
  duration: string | null;
  file_size: number;
  order: number;
  created_at: string;
  // UI-only (not saved to DB)
  _videoMode?: "upload" | "url";
}

export interface Assessment {
  id: string;
  course_id: string;
  section_id: string | null;
  title: string;
  description: string | null;
  assessment_type: "quiz" | "essay" | "file_upload" | "interview";
  time_limit_minutes: number | null;
  passing_score: number;
  max_attempts: number;
  is_published: boolean;
  order: number;
  created_at: string;
  // Joined
  questions?: AssessmentQuestion[];
  submissions?: StudentSubmission[];
  interview_schedules?: InterviewSchedule[];
}

export interface AssessmentQuestion {
  id: string;
  assessment_id: string;
  question_text: string;
  question_type: "multiple_choice" | "essay" | "file_upload";
  points: number;
  order: number;
  created_at: string;
  // Joined
  options?: QuestionOption[];
}

export interface QuestionOption {
  id: string;
  question_id: string;
  option_text: string;
  is_correct: boolean;
  order: number;
}

export interface StudentSubmission {
  id: string;
  assessment_id: string;
  student_id: string;
  status: "in_progress" | "submitted" | "graded";
  score: number | null;
  feedback: string | null;
  started_at: string;
  submitted_at: string | null;
  graded_at: string | null;
  graded_by: string | null;
  // Joined
  answers?: SubmissionAnswer[];
  student?: DBUser;
}

export interface SubmissionAnswer {
  id: string;
  submission_id: string;
  question_id: string;
  selected_option_id: string | null;
  answer_text: string | null;
  file_url: string | null;
  is_correct: boolean | null;
  points_earned: number;
}

export interface InterviewSchedule {
  id: string;
  assessment_id: string;
  student_id: string;
  scheduled_at: string;
  meeting_url: string | null;
  status: "scheduled" | "completed" | "cancelled" | "rescheduled";
  notes: string | null;
  teacher_notes: string | null;
  score: number | null;
  created_at: string;
  // Joined
  student?: DBUser;
}

export interface CourseReview {
  id: string;
  reviewer_name: string;
  avatar_initials: string;
  rating: number;
  text: string;
  created_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  text: string;
  avatar_initials: string;
  created_at: string;
}

export interface DBUser {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  headline: string | null;
  role: UserRole;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  specializations: string[];
  experience_level: "beginner" | "intermediate" | "advanced";
  goals: string[];
  known_languages: string[];
  onboarding_completed: boolean;
  ai_summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface AIChatMessage {
  id: string;
  user_id: string;
  course_id: string | null;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}
