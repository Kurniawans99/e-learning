-- ======================================================
-- Expanded Seed Data: 12+ courses across 6 specializations
-- Run this in Supabase SQL Editor AFTER the original seed.sql
-- ======================================================

-- Additional Instructors
INSERT INTO public.instructors (id, name, title, bio, student_count, course_count, rating) VALUES
('d4567890-aaaa-5678-1234-567812345678', 'Alex Chen', 'Senior Frontend Engineer', 'Ex-Google frontend lead with 10+ years building React apps at scale. Created popular open-source UI libraries.', 38000, 5, 4.9),
('d4567890-bbbb-5678-1234-567812345678', 'Sarah Martinez', 'Game Development Lead', 'Former Ubisoft game designer, shipped 3 AAA titles. Unity & Unreal expert.', 22000, 4, 4.8),
('d4567890-cccc-5678-1234-567812345678', 'Dr. Rina Patel', 'Data Science Director', 'PhD in Statistics from MIT. Led data teams at Netflix and Spotify.', 45000, 6, 4.9),
('d4567890-dddd-5678-1234-567812345678', 'James Park', 'Cloud Architect', 'AWS Hero & GCP Fellow. Designed infrastructure for 100M+ user platforms.', 31000, 4, 4.7),
('d4567890-eeee-5678-1234-567812345678', 'Maria Santos', 'UX Design Lead', 'Former Design Director at Airbnb. Specializes in design systems and user research.', 28000, 5, 4.8),
('d4567890-ffff-5678-1234-567812345678', 'Dr. Kenji Tanaka', 'NLP Researcher', 'Published 40+ papers on NLP. Former research scientist at OpenAI.', 19000, 3, 4.9)
ON CONFLICT (id) DO NOTHING;

-- ============ WEB DEVELOPMENT COURSES ============

INSERT INTO public.courses (id, slug, title, subtitle, category, level, price, original_price, rating, review_count, student_count, hours, module_count, narrative, instructor_id) VALUES
('11111111-1111-1111-1111-111111111111', 'react-mastery', 'React Mastery: From Zero to Production', 'Build modern, scalable web applications with React 19 and Next.js.', 'Web Development', 'Intermediate', 79, 129, 4.9, 3200, 22000, 28, 10, 'Kursus ini mengajarkan React dari dasar hingga production-ready. Anda akan mempelajari hooks, state management, server components, dan deployment.\n\nDengan proyek nyata seperti membangun e-commerce dan dashboard analytics, Anda akan siap untuk bekerja sebagai frontend developer profesional.', 'd4567890-aaaa-5678-1234-567812345678'),
('11111111-2222-1111-1111-111111111111', 'nextjs-fullstack', 'Next.js Full-Stack Development', 'Master server-side rendering, API routes, and full-stack architecture with Next.js.', 'Web Development', 'Advanced', 99, 159, 4.8, 1800, 14000, 35, 12, 'Pelajari cara membangun aplikasi full-stack modern dengan Next.js. Dari server components hingga API routes, database integration, dan deployment.\n\nAnda akan membangun 3 proyek nyata: blog platform, SaaS dashboard, dan marketplace.', 'd4567890-aaaa-5678-1234-567812345678'),
('11111111-3333-1111-1111-111111111111', 'css-architecture', 'CSS Architecture & Design Systems', 'Create scalable, maintainable CSS architectures and component libraries.', 'Web Development', 'Intermediate', 59, 99, 4.7, 1500, 11000, 18, 8, 'Pelajari arsitektur CSS modern: dari BEM methodology hingga CSS-in-JS, Tailwind, dan design tokens.\n\nAnda akan merancang dan membangun design system lengkap yang siap digunakan di production.', 'd4567890-eeee-5678-1234-567812345678')
ON CONFLICT (id) DO NOTHING;

-- ============ GAME DEVELOPMENT COURSES ============

INSERT INTO public.courses (id, slug, title, subtitle, category, level, price, original_price, rating, review_count, student_count, hours, module_count, narrative, instructor_id) VALUES
('22222222-1111-2222-2222-222222222222', 'unity-fundamentals', 'Unity Game Development Fundamentals', 'Create 2D and 3D games from scratch using Unity and C#.', 'Game Development', 'Beginner', 69, 119, 4.8, 2800, 19000, 32, 11, 'Mulai perjalanan game development Anda dengan Unity. Pelajari C# programming, physics engine, animation, dan UI system.\n\nAnda akan membuat 4 game: platformer 2D, endless runner, FPS sederhana, dan RPG top-down.', 'd4567890-bbbb-5678-1234-567812345678'),
('22222222-2222-2222-2222-222222222222', 'unreal-engine', 'Unreal Engine 5: AAA Game Development', 'Build stunning games with Unreal Engine 5 and Blueprints.', 'Game Development', 'Advanced', 149, 249, 4.9, 1400, 8500, 45, 16, 'Pelajari Unreal Engine 5 dari dasar hingga advanced. Nanite, Lumen, World Partition, dan Blueprints visual scripting.\n\nAnda akan membangun open-world game dengan grafik kualitas AAA.', 'd4567890-bbbb-5678-1234-567812345678'),
('22222222-3333-2222-2222-222222222222', 'game-design-patterns', 'Game Design Patterns & Architecture', 'Master the software patterns that power modern game engines.', 'Game Development', 'Intermediate', 89, 139, 4.7, 950, 6200, 22, 9, 'Pelajari pattern yang digunakan di industri game: Entity Component System, Observer, State Machine, Object Pooling, dan Command Pattern.\n\nSetiap pattern diimplementasikan dalam proyek game nyata.', 'd4567890-bbbb-5678-1234-567812345678')
ON CONFLICT (id) DO NOTHING;

-- ============ DATA SCIENCE COURSES ============

INSERT INTO public.courses (id, slug, title, subtitle, category, level, price, original_price, rating, review_count, student_count, hours, module_count, narrative, instructor_id) VALUES
('33333333-1111-3333-3333-333333333333', 'python-data-science', 'Python for Data Science & Analytics', 'Master Python, Pandas, NumPy, and data visualization for real-world analysis.', 'Data Science', 'Beginner', 69, 109, 4.9, 4100, 32000, 26, 10, 'Kursus komprehensif Python untuk data science. Dari dasar Python hingga Pandas, NumPy, Matplotlib, dan Seaborn.\n\nAnda akan menganalisis dataset nyata dari Kaggle dan membangun dashboard analytics interaktif.', 'd4567890-cccc-5678-1234-567812345678'),
('33333333-2222-3333-3333-333333333333', 'machine-learning-fundamentals', 'Machine Learning Fundamentals', 'Understand and implement core ML algorithms from scratch.', 'Data Science', 'Intermediate', 99, 159, 4.8, 2700, 18000, 30, 12, 'Pelajari machine learning dari teori hingga implementasi: regresi, klasifikasi, clustering, ensemble methods, dan neural networks dasar.\n\nSetiap algoritma diimplementasikan dari scratch kemudian menggunakan scikit-learn.', 'd4567890-cccc-5678-1234-567812345678'),
('33333333-3333-3333-3333-333333333333', 'data-visualization', 'Data Visualization & Storytelling', 'Transform raw data into compelling visual narratives.', 'Data Science', 'Beginner', 49, 89, 4.7, 1600, 12000, 16, 7, 'Pelajari seni visualisasi data: dari chart sederhana hingga dashboard interaktif menggunakan D3.js, Plotly, dan Tableau.\n\nAnda akan belajar prinsip visual design untuk data dan membuat portfolio visualisasi.', 'd4567890-cccc-5678-1234-567812345678')
ON CONFLICT (id) DO NOTHING;

-- ============ AI & ML (Additional) ============

INSERT INTO public.courses (id, slug, title, subtitle, category, level, price, original_price, rating, review_count, student_count, hours, module_count, narrative, instructor_id) VALUES
('44444444-1111-4444-4444-444444444444', 'nlp-fundamentals', 'Natural Language Processing with Transformers', 'Build text analysis, chatbots, and language models using modern NLP.', 'AI & ML', 'Advanced', 129, 199, 4.9, 1800, 9500, 32, 11, 'Pelajari NLP modern: dari tokenization hingga fine-tuning transformer models. Menggunakan Hugging Face, PyTorch, dan teknik prompt engineering.\n\nAnda akan membangun chatbot, sentiment analyzer, dan text summarizer.', 'd4567890-ffff-5678-1234-567812345678'),
('44444444-2222-4444-4444-444444444444', 'deep-learning', 'Deep Learning: Neural Networks Masterclass', 'Master CNNs, RNNs, GANs, and modern deep learning architectures.', 'AI & ML', 'Advanced', 139, 219, 4.8, 2200, 11000, 40, 14, 'Kursus deep learning komprehensif: convolutional networks, recurrent networks, attention mechanisms, GANs, dan diffusion models.\n\nDari teori matematika hingga implementasi PyTorch yang production-ready.', 'd4567890-ffff-5678-1234-567812345678')
ON CONFLICT (id) DO NOTHING;

-- ============ ENGINEERING (Additional) ============

INSERT INTO public.courses (id, slug, title, subtitle, category, level, price, original_price, rating, review_count, student_count, hours, module_count, narrative, instructor_id) VALUES
('55555555-1111-5555-5555-555555555555', 'cloud-architecture', 'Cloud Architecture: AWS, GCP & Azure', 'Design and deploy scalable cloud infrastructure across major platforms.', 'Engineering', 'Intermediate', 109, 179, 4.8, 2100, 15000, 35, 13, 'Pelajari cloud architecture di ketiga platform utama: AWS, Google Cloud, dan Azure. Dari virtual machines hingga serverless, containers, dan microservices.\n\nAnda akan merancang dan mendeploy arsitektur untuk startup hingga enterprise.', 'd4567890-dddd-5678-1234-567812345678'),
('55555555-2222-5555-5555-555555555555', 'devops-pipeline', 'DevOps & CI/CD Pipeline Mastery', 'Automate everything: from code commit to production deployment.', 'Engineering', 'Intermediate', 89, 149, 4.7, 1700, 13000, 28, 10, 'Kuasai DevOps modern: Docker, Kubernetes, GitHub Actions, Terraform, dan monitoring.\n\nAnda akan membangun pipeline CI/CD lengkap dan infrastructure-as-code dari nol.', 'd4567890-dddd-5678-1234-567812345678')
ON CONFLICT (id) DO NOTHING;

-- ============ UI/UX DESIGN ============

INSERT INTO public.courses (id, slug, title, subtitle, category, level, price, original_price, rating, review_count, student_count, hours, module_count, narrative, instructor_id) VALUES
('66666666-1111-6666-6666-666666666666', 'figma-mastery', 'Figma Mastery: UI Design from A to Z', 'Design stunning interfaces and build complete design systems in Figma.', 'Design', 'Beginner', 59, 99, 4.9, 3500, 25000, 22, 9, 'Pelajari Figma dari dasar hingga advanced: auto-layout, components, variants, prototyping, dan design tokens.\n\nAnda akan merancang 3 aplikasi lengkap: mobile app, web dashboard, dan landing page.', 'd4567890-eeee-5678-1234-567812345678'),
('66666666-2222-6666-6666-666666666666', 'ux-research', 'UX Research & User-Centered Design', 'Master research methodologies that drive product decisions.', 'Design', 'Intermediate', 79, 129, 4.8, 1200, 8500, 20, 8, 'Pelajari UX research dari interview techniques hingga usability testing, A/B testing, dan data-driven design decisions.\n\nAnda akan melakukan research project nyata dan membangun research portfolio.', 'd4567890-eeee-5678-1234-567812345678')
ON CONFLICT (id) DO NOTHING;

-- ============ TAGS FOR NEW COURSES ============

INSERT INTO public.course_tags (course_id, tag_name) VALUES
('11111111-1111-1111-1111-111111111111', 'React'), ('11111111-1111-1111-1111-111111111111', 'JavaScript'), ('11111111-1111-1111-1111-111111111111', 'Frontend'),
('11111111-2222-1111-1111-111111111111', 'Next.js'), ('11111111-2222-1111-1111-111111111111', 'Full-Stack'), ('11111111-2222-1111-1111-111111111111', 'TypeScript'),
('11111111-3333-1111-1111-111111111111', 'CSS'), ('11111111-3333-1111-1111-111111111111', 'Design Systems'),
('22222222-1111-2222-2222-222222222222', 'Unity'), ('22222222-1111-2222-2222-222222222222', 'C#'), ('22222222-1111-2222-2222-222222222222', 'Game Dev'),
('22222222-2222-2222-2222-222222222222', 'Unreal Engine'), ('22222222-2222-2222-2222-222222222222', 'C++'), ('22222222-2222-2222-2222-222222222222', 'AAA'),
('22222222-3333-2222-2222-222222222222', 'Design Patterns'), ('22222222-3333-2222-2222-222222222222', 'Architecture'),
('33333333-1111-3333-3333-333333333333', 'Python'), ('33333333-1111-3333-3333-333333333333', 'Pandas'), ('33333333-1111-3333-3333-333333333333', 'Data Analytics'),
('33333333-2222-3333-3333-333333333333', 'Machine Learning'), ('33333333-2222-3333-3333-333333333333', 'scikit-learn'),
('33333333-3333-3333-3333-333333333333', 'Visualization'), ('33333333-3333-3333-3333-333333333333', 'D3.js'),
('44444444-1111-4444-4444-444444444444', 'NLP'), ('44444444-1111-4444-4444-444444444444', 'Transformers'), ('44444444-1111-4444-4444-444444444444', 'PyTorch'),
('44444444-2222-4444-4444-444444444444', 'Deep Learning'), ('44444444-2222-4444-4444-444444444444', 'Neural Networks'),
('55555555-1111-5555-5555-555555555555', 'AWS'), ('55555555-1111-5555-5555-555555555555', 'Cloud'), ('55555555-1111-5555-5555-555555555555', 'GCP'),
('55555555-2222-5555-5555-555555555555', 'DevOps'), ('55555555-2222-5555-5555-555555555555', 'Docker'), ('55555555-2222-5555-5555-555555555555', 'Kubernetes'),
('66666666-1111-6666-6666-666666666666', 'Figma'), ('66666666-1111-6666-6666-666666666666', 'UI Design'),
('66666666-2222-6666-6666-666666666666', 'UX Research'), ('66666666-2222-6666-6666-666666666666', 'User Testing')
ON CONFLICT DO NOTHING;

-- ============ REVIEWS FOR NEW COURSES ============

INSERT INTO public.course_reviews (course_id, reviewer_name, avatar_initials, rating, text) VALUES
('11111111-1111-1111-1111-111111111111', 'Budi Santoso', 'BS', 5, 'Kursus React terbaik yang pernah saya ikuti. Langsung bisa apply di kerjaan!'),
('11111111-1111-1111-1111-111111111111', 'Lisa Wang', 'LW', 5, 'Penjelasan hooks dan server components sangat clear. Highly recommended!'),
('22222222-1111-2222-2222-222222222222', 'Ahmad Rizki', 'AR', 5, 'Dari nol sekarang bisa bikin game sendiri. Instructor-nya luar biasa!'),
('22222222-1111-2222-2222-222222222222', 'Dewi Putri', 'DP', 4, 'Game projects-nya seru dan menantang. Pengen lanjut ke Unreal Engine!'),
('33333333-1111-3333-3333-333333333333', 'Fajar Nugroho', 'FN', 5, 'Sekarang bisa analisis data pakai Python. Berguna banget buat karir saya.'),
('33333333-1111-3333-3333-333333333333', 'Siti Aminah', 'SA', 5, 'Dataset real-world nya bikin belajar jadi lebih bermakna.'),
('66666666-1111-6666-6666-666666666666', 'Rani Wijaya', 'RW', 5, 'Auto-layout explanation nya terbaik! Portfolio Figma saya jadi professional.'),
('55555555-1111-5555-5555-555555555555', 'Kevin Hartono', 'KH', 4, 'Sekarang paham perbedaan AWS, GCP, dan Azure. Sangat komprehensif.')
ON CONFLICT DO NOTHING;
