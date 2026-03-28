-- Insert Instructors
INSERT INTO public.instructors (id, name, title, bio, student_count, course_count, rating, avatar_url) VALUES
('b2345678-1234-5678-1234-567812345678', 'Dr. Julian Sterling', 'AI Design Researcher', 'Spent 8 years at Figma as Head of AI Research before founding his design education studio.', 42000, 7, 4.9, NULL),
('c3456789-1234-5678-1234-567812345678', 'Elena Rostova', 'Quantum Computing Lead', 'Former IBM Q researcher focusing on quantum algorithms.', 15000, 3, 4.8, NULL);

-- Insert Courses
INSERT INTO public.courses (id, slug, title, subtitle, category, level, price, original_price, rating, review_count, student_count, hours, module_count, narrative, instructor_id) VALUES
('a1234567-1234-5678-1234-567812345678', 'neural-networks-vision', 'Mastering Neural Networks for Computer Vision', 'Explore the symbiotic relationship between AI and visual data parsing.', 'AI & ML', 'Intermediate', 89, 149, 4.9, 2450, 15200, 24, 8, 'This course dives deep into how machine learning models interpret visual hierarchy and leverage actionable insights to create breathtakingly intuitive interfaces.\n\nThrough high-end editorial examples and real-world AI implementation, you will learn to move beyond generic layouts.', 'b2345678-1234-5678-1234-567812345678'),
('d4567890-1234-5678-1234-567812345678', 'quantum-computation', 'Quantum Computing Foundations', 'Break into the future of computing with qubits and entanglement.', 'Engineering', 'Advanced', 149, 199, 4.8, 1200, 5200, 35, 12, 'Quantum computing will redefine processing power. This foundations course bridges the gap between quantum mechanics theory and practical algorithmic structuring.', 'c3456789-1234-5678-1234-567812345678'),
('e5678901-1234-5678-1234-567812345678', 'system-design-patterns', 'System Design Patterns for Scale', 'Architecting robust backends that handle millions of users.', 'Engineering', 'Advanced', 129, 199, 4.8, 3100, 18500, 40, 15, 'Scaling systems require deep understanding of distributed databases, caching layers, and load balancers. You will build a system designed for 10 million concurrent users.', 'b2345678-1234-5678-1234-567812345678');

-- Insert Tags
INSERT INTO public.course_tags (course_id, tag_name) VALUES
('a1234567-1234-5678-1234-567812345678', 'AI Design'),
('a1234567-1234-5678-1234-567812345678', 'Neural Networks'),
('a1234567-1234-5678-1234-567812345678', 'Computer Vision');

-- Insert Outcomes
INSERT INTO public.course_outcomes (course_id, description, "order") VALUES
('a1234567-1234-5678-1234-567812345678', 'The principles of AI-driven visual curation and hierarchy', 1),
('a1234567-1234-5678-1234-567812345678', 'Advanced taxonomy models for autonomous vision systems', 2),
('a1234567-1234-5678-1234-567812345678', 'Building adaptive learning systems for edge AI devices', 3);

-- Insert Curriculum Sections
INSERT INTO public.curriculum_sections (id, course_id, title, "order") VALUES
('f1111111-1234-5678-1234-567812345678', 'a1234567-1234-5678-1234-567812345678', 'Introduction to Computer Vision', 1),
('f2222222-1234-5678-1234-567812345678', 'a1234567-1234-5678-1234-567812345678', 'Convolutional Layers Deep Dive', 2);

-- Insert Lessons
INSERT INTO public.lessons (section_id, title, duration, type, is_locked, "order") VALUES
('f1111111-1234-5678-1234-567812345678', 'What is Computer Vision?', '8:20', 'video', false, 1),
('f1111111-1234-5678-1234-567812345678', 'The AI-Vision Symbiosis', '12:45', 'video', false, 2),
('f1111111-1234-5678-1234-567812345678', 'Vision Quiz 1', '10 mins', 'quiz', false, 3),
('f2222222-1234-5678-1234-567812345678', 'Generative vs Analytical AI', '18:15', 'video', true, 1),
('f2222222-1234-5678-1234-567812345678', 'Vision Workshop Project', '45 mins', 'project', true, 2);

-- Insert Testimonials (Landing Page)
INSERT INTO public.testimonials (name, role, text, avatar_initials) VALUES
('Sarah Kim', 'ML Engineer @ Google', 'IntelliCourse didn''t just teach me ML — it understood my gaps and patched them precisely. I went from hobbyist to Google in 8 months.', 'SK'),
('Marcus Chen', 'Senior Designer @ Figma', 'The AI knew I needed visual-first content before I even realized it. Every recommendation felt like it was made by someone who knew me.', 'MC'),
('Aisha Patel', 'Blockchain Dev @ Ethereum', 'I''d been stuck in tutorial hell for two years. IntelliCourse''s path correction broke the cycle in weeks.', 'AP');

-- Insert Course Reviews
INSERT INTO public.course_reviews (course_id, reviewer_name, avatar_initials, rating, text) VALUES
('a1234567-1234-5678-1234-567812345678', 'David Park', 'DP', 5, 'Finally a course that takes AI seriously. The curriculum blueprint is structured unlike anything I''ve seen.'),
('a1234567-1234-5678-1234-567812345678', 'Priya Nair', 'PN', 4, 'Genuinely transformed my portfolio. Got three interview requests fast!');
