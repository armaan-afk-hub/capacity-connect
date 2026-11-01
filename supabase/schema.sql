-- ==============================================================================
-- CAPACITY CONNECT (SIH26075) - PostgreSQL Database Schema & RLS Policies
-- Digital Capacity Building and Learning Management Portal
-- College Internet & Web Programming Lab Mini Project
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables if re-running
DROP TABLE IF EXISTS public.announcements CASCADE;
DROP TABLE IF EXISTS public.lesson_progress CASCADE;
DROP TABLE IF EXISTS public.results CASCADE;
DROP TABLE IF EXISTS public.questions CASCADE;
DROP TABLE IF EXISTS public.quizzes CASCADE;
DROP TABLE IF EXISTS public.materials CASCADE;
DROP TABLE IF EXISTS public.enrollments CASCADE;
DROP TABLE IF EXISTS public.courses CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'trainer', 'admin')),
  avatar_url TEXT,
  phone TEXT,
  organization TEXT,
  bio TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- 2. COURSES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trainer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  thumbnail_url TEXT,
  duration TEXT DEFAULT '4 Weeks',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- 3. ENROLLMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  enrolled_at TIMESTAMPTZ DEFAULT timezone('utc', now()),
  status TEXT DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'completed')),
  UNIQUE(student_id, course_id)
);

-- ------------------------------------------------------------------------------
-- 4. MATERIALS TABLE (PDF Documents)
-- ------------------------------------------------------------------------------
CREATE TABLE public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  trainer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT DEFAULT 'pdf',
  uploaded_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- 5. QUIZZES TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  duration_minutes INTEGER DEFAULT 15,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- 6. QUESTIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D'))
);

-- ------------------------------------------------------------------------------
-- 7. RESULTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE public.results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total_marks INTEGER NOT NULL DEFAULT 5,
  attempted_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- 8. LESSON PROGRESS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE public.lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id TEXT NOT NULL,
  completed BOOLEAN DEFAULT true,
  UNIQUE(student_id, course_id, lesson_id)
);

-- ------------------------------------------------------------------------------
-- 9. ANNOUNCEMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc', now())
);

-- ------------------------------------------------------------------------------
-- INDEXES
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_courses_trainer ON public.courses(trainer_id);
CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course ON public.enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_materials_course ON public.materials(course_id);
CREATE INDEX IF NOT EXISTS idx_quizzes_course ON public.quizzes(course_id);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON public.questions(quiz_id);
CREATE INDEX IF NOT EXISTS idx_results_student ON public.results(student_id);

-- ------------------------------------------------------------------------------
-- TRIGGER: AUTO-CREATE PROFILE ON AUTH SIGNUP
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_role TEXT;
  name_val TEXT;
BEGIN
  assigned_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  IF assigned_role NOT IN ('student', 'trainer') THEN
    assigned_role := 'student';
  END IF;
  name_val := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));

  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, name_val, NEW.email, assigned_role)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- ENABLE ROW LEVEL SECURITY
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS POLICIES (With Safe DROP IF EXISTS)
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public profiles are viewable by authenticated users" ON public.profiles;
CREATE POLICY "Public profiles are viewable by authenticated users" ON public.profiles FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Public profiles are viewable by anon" ON public.profiles;
CREATE POLICY "Public profiles are viewable by anon" ON public.profiles FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Courses
DROP POLICY IF EXISTS "Approved courses are viewable by everyone" ON public.courses;
CREATE POLICY "Approved courses are viewable by everyone" ON public.courses FOR SELECT USING (status = 'approved' OR auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can insert courses" ON public.courses;
CREATE POLICY "Trainers can insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can update their own courses" ON public.courses;
CREATE POLICY "Trainers can update their own courses" ON public.courses FOR UPDATE TO authenticated USING (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can delete courses" ON public.courses;
CREATE POLICY "Trainers can delete courses" ON public.courses FOR DELETE TO authenticated USING (auth.uid() = trainer_id);

-- Enrollments
DROP POLICY IF EXISTS "Users view relevant enrollments" ON public.enrollments;
CREATE POLICY "Users view relevant enrollments" ON public.enrollments FOR SELECT TO authenticated USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.courses WHERE courses.id = enrollments.course_id AND courses.trainer_id = auth.uid()));

DROP POLICY IF EXISTS "Students can enroll in approved courses" ON public.enrollments;
CREATE POLICY "Students can enroll in approved courses" ON public.enrollments FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- Materials
DROP POLICY IF EXISTS "View materials" ON public.materials;
CREATE POLICY "View materials" ON public.materials FOR SELECT TO authenticated USING (auth.uid() = trainer_id OR EXISTS (SELECT 1 FROM public.enrollments WHERE enrollments.course_id = materials.course_id AND enrollments.student_id = auth.uid()));

DROP POLICY IF EXISTS "Trainers can upload materials" ON public.materials;
CREATE POLICY "Trainers can upload materials" ON public.materials FOR INSERT TO authenticated WITH CHECK (auth.uid() = trainer_id);

DROP POLICY IF EXISTS "Trainers can delete materials" ON public.materials;
CREATE POLICY "Trainers can delete materials" ON public.materials FOR DELETE TO authenticated USING (auth.uid() = trainer_id);

-- Quizzes & Questions
DROP POLICY IF EXISTS "View quizzes" ON public.quizzes;
CREATE POLICY "View quizzes" ON public.quizzes FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Trainers can manage quizzes" ON public.quizzes;
CREATE POLICY "Trainers can manage quizzes" ON public.quizzes FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.courses WHERE courses.id = quizzes.course_id AND courses.trainer_id = auth.uid()));

DROP POLICY IF EXISTS "View questions" ON public.questions;
CREATE POLICY "View questions" ON public.questions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Trainers can manage questions" ON public.questions;
CREATE POLICY "Trainers can manage questions" ON public.questions FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.quizzes JOIN public.courses ON courses.id = quizzes.course_id WHERE quizzes.id = questions.quiz_id AND courses.trainer_id = auth.uid()));

-- Results
DROP POLICY IF EXISTS "View results" ON public.results;
CREATE POLICY "View results" ON public.results FOR SELECT TO authenticated USING (auth.uid() = student_id OR EXISTS (SELECT 1 FROM public.quizzes JOIN public.courses ON courses.id = quizzes.course_id WHERE quizzes.id = results.quiz_id AND courses.trainer_id = auth.uid()));

DROP POLICY IF EXISTS "Students insert results" ON public.results;
CREATE POLICY "Students insert results" ON public.results FOR INSERT TO authenticated WITH CHECK (auth.uid() = student_id);

-- Lesson Progress
DROP POLICY IF EXISTS "Manage lesson progress" ON public.lesson_progress;
CREATE POLICY "Manage lesson progress" ON public.lesson_progress FOR ALL TO authenticated USING (auth.uid() = student_id) WITH CHECK (auth.uid() = student_id);

-- Announcements
DROP POLICY IF EXISTS "Everyone views announcements" ON public.announcements;
CREATE POLICY "Everyone views announcements" ON public.announcements FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users insert announcements" ON public.announcements;
CREATE POLICY "Authenticated users insert announcements" ON public.announcements FOR INSERT TO authenticated WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- STORAGE BUCKETS
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('course-thumbnails', 'course-thumbnails', true),
       ('learning-materials', 'learning-materials', true),
       ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read course-thumbnails" ON storage.objects;
CREATE POLICY "Public read course-thumbnails" ON storage.objects FOR SELECT USING (bucket_id = 'course-thumbnails');

DROP POLICY IF EXISTS "Authenticated upload course-thumbnails" ON storage.objects;
CREATE POLICY "Authenticated upload course-thumbnails" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'course-thumbnails');

DROP POLICY IF EXISTS "Authenticated read learning-materials" ON storage.objects;
CREATE POLICY "Authenticated read learning-materials" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'learning-materials');

DROP POLICY IF EXISTS "Authenticated upload learning-materials" ON storage.objects;
CREATE POLICY "Authenticated upload learning-materials" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'learning-materials');

DROP POLICY IF EXISTS "Public read user-avatars" ON storage.objects;
CREATE POLICY "Public read user-avatars" ON storage.objects FOR SELECT USING (bucket_id = 'user-avatars');

DROP POLICY IF EXISTS "Authenticated upload user-avatars" ON storage.objects;
CREATE POLICY "Authenticated upload user-avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'user-avatars');
