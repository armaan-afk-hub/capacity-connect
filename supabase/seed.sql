-- ==============================================================================
-- CAPACITY CONNECT (SIH26075) - Student Demo Seeder & Direct SQL Auth Setup
-- Single-Click Execution in Supabase SQL Editor
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SET search_path TO public, extensions, auth;

DO $$
DECLARE
  -- Student 1
  v_student1_id UUID := gen_random_uuid();
  v_student1_email TEXT := 'student@connect.edu';
  v_student1_pass TEXT := 'Student@123';
  v_student1_name TEXT := 'Rohan Verma';

  -- Student 2
  v_student2_id UUID := gen_random_uuid();
  v_student2_email TEXT := 'priya.student@gmail.com';
  v_student2_pass TEXT := 'Student@123';
  v_student2_name TEXT := 'Priya Patel';

  q_rec RECORD;
BEGIN
  ------------------------------------------------------------------------------
  -- 1. Remove any previous test accounts with these emails
  ------------------------------------------------------------------------------
  DELETE FROM auth.users WHERE email IN (v_student1_email, v_student2_email);
  DELETE FROM public.profiles WHERE email IN (v_student1_email, v_student2_email);
  DELETE FROM auth.identities WHERE identity_data->>'email' IN (v_student1_email, v_student2_email);

  ------------------------------------------------------------------------------
  -- 2. Insert into auth.users (Pre-confirmed = No email dispatch)
  ------------------------------------------------------------------------------
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    v_student1_id,
    'authenticated',
    'authenticated',
    v_student1_email,
    crypt(v_student1_pass, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    json_build_object('full_name', v_student1_name, 'role', 'student')::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    v_student2_id,
    'authenticated',
    'authenticated',
    v_student2_email,
    crypt(v_student2_pass, gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    json_build_object('full_name', v_student2_name, 'role', 'student')::jsonb,
    now(),
    now(),
    '',
    '',
    '',
    ''
  );

  ------------------------------------------------------------------------------
  -- 3. Insert Auth Identities (id is UUID in Supabase)
  ------------------------------------------------------------------------------
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES 
  (
    v_student1_id,
    v_student1_id,
    json_build_object('sub', v_student1_id::text, 'email', v_student1_email)::jsonb,
    'email',
    v_student1_id::text,
    now(),
    now(),
    now()
  ),
  (
    v_student2_id,
    v_student2_id,
    json_build_object('sub', v_student2_id::text, 'email', v_student2_email)::jsonb,
    'email',
    v_student2_id::text,
    now(),
    now(),
    now()
  );

  ------------------------------------------------------------------------------
  -- 4. Create Profiles in public.profiles (role = 'student')
  ------------------------------------------------------------------------------
  INSERT INTO public.profiles (id, full_name, email, role, bio, is_active)
  VALUES 
    (v_student1_id, v_student1_name, v_student1_email, 'student', 'Undergraduate Student | Web Technologies & Cloud Systems Learner', true),
    (v_student2_id, v_student2_name, v_student2_email, 'student', 'Information Technology Scholar | Cybersecurity & Python Enthusiast', true)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = 'student',
    bio = EXCLUDED.bio,
    is_active = true;

  ------------------------------------------------------------------------------
  -- 5. Enroll Students into Available Courses
  ------------------------------------------------------------------------------
  INSERT INTO public.enrollments (student_id, course_id, status, enrolled_at)
  SELECT v_student1_id, id, 'enrolled', now() - INTERVAL '3 days'
  FROM public.courses
  ON CONFLICT (student_id, course_id) DO NOTHING;

  INSERT INTO public.enrollments (student_id, course_id, status, enrolled_at)
  SELECT v_student2_id, id, 'enrolled', now() - INTERVAL '2 days'
  FROM public.courses
  LIMIT 2
  ON CONFLICT (student_id, course_id) DO NOTHING;

  ------------------------------------------------------------------------------
  -- 6. Add Completed Quiz Results (Populates Results History & Overview Badges)
  ------------------------------------------------------------------------------
  FOR q_rec IN (
    SELECT q.id, COALESCE(COUNT(qs.id), 2) as q_count
    FROM public.quizzes q
    LEFT JOIN public.questions qs ON qs.quiz_id = q.id
    GROUP BY q.id
    LIMIT 2
  ) LOOP
    INSERT INTO public.results (student_id, quiz_id, score, total_marks, attempted_at)
    VALUES (
      v_student1_id, 
      q_rec.id, 
      GREATEST(q_rec.q_count, 2), 
      GREATEST(q_rec.q_count, 2), 
      now() - INTERVAL '1 day'
    );
  END LOOP;

  ------------------------------------------------------------------------------
  -- 7. Add Lesson Progress Records
  ------------------------------------------------------------------------------
  INSERT INTO public.lesson_progress (student_id, course_id, lesson_id, completed)
  SELECT v_student1_id, id, 'module_1_orientation', true
  FROM public.courses
  ON CONFLICT (student_id, course_id, lesson_id) DO NOTHING;

  RAISE NOTICE 'SUCCESS: Both student accounts ready to sign in!';
END $$;
