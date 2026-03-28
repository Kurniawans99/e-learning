// Core database types reflecting the tables in our schema

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
  order: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  title: string;
  duration: string;
  type: "video" | "quiz" | "project" | "reading";
  is_locked: boolean;
  order: number;
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
  created_at: string;
}
