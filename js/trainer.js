// ==============================================================================
// CAPACITY CONNECT - Trainer Controller
// SIH26075 - Digital Capacity Building and Learning Management Portal
// ==============================================================================

/**
 * Fetch courses authored by trainer
 */
async function getTrainerCourses(trainerId) {
  if (!window.supabaseClient || !trainerId) return [];

  const { data, error } = await window.supabaseClient
    .from('courses')
    .select('*, enrollments(count)')
    .eq('trainer_id', trainerId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching trainer courses:', error);
    return [];
  }
  return data || [];
}

/**
 * Create a new course (default status: pending for admin approval)
 */
async function createCourse(trainerId, { title, description, category, duration, thumbnailUrl }) {
  if (!window.supabaseClient) throw new Error('Database not connected.');

  const { data, error } = await window.supabaseClient
    .from('courses')
    .insert([
      {
        trainer_id: trainerId,
        title,
        description,
        category,
        duration: duration || '4 Weeks',
        thumbnail_url: thumbnailUrl || null,
        status: 'pending', // Requires admin approval
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete a course
 */
async function deleteCourse(courseId) {
  if (!window.supabaseClient) throw new Error('Database not connected.');

  const { error } = await window.supabaseClient
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) throw error;
  return true;
}

/**
 * Upload PDF learning material to Supabase Storage and register in database
 */
async function uploadLearningMaterial(trainerId, courseId, title, file) {
  if (!window.supabaseClient) throw new Error('Database not connected.');

  if (!file.name.toLowerCase().endsWith('.pdf')) {
    throw new Error('Only PDF documents are permitted for learning materials.');
  }

  // Max 25MB check
  if (file.size > 25 * 1024 * 1024) {
    throw new Error('File exceeds the 25MB limit.');
  }

  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filePath = `${courseId}/${Date.now()}_${cleanName}`;

  // Upload to Storage
  const { error: uploadError } = await window.supabaseClient.storage
    .from('learning-materials')
    .upload(filePath, file, { upsert: false });

  if (uploadError) throw uploadError;

  // Retrieve public URL
  const { data: urlData } = window.supabaseClient.storage
    .from('learning-materials')
    .getPublicUrl(filePath);

  // Insert database record
  const { data: material, error: dbError } = await window.supabaseClient
    .from('materials')
    .insert([
      {
        course_id: courseId,
        trainer_id: trainerId,
        title,
        file_url: urlData.publicUrl,
        file_type: 'pdf',
      },
    ])
    .select()
    .single();

  if (dbError) throw dbError;
  return material;
}

/**
 * Fetch materials for a trainer's courses
 */
async function getTrainerMaterials(trainerId) {
  if (!window.supabaseClient || !trainerId) return [];

  const { data, error } = await window.supabaseClient
    .from('materials')
    .select('*, course:courses(title)')
    .eq('trainer_id', trainerId)
    .order('uploaded_at', { ascending: false });

  if (error) return [];
  return data || [];
}

/**
 * Delete a material from DB and Storage
 */
async function deleteMaterial(materialId, fileUrl) {
  if (!window.supabaseClient) throw new Error('Database not connected.');

  const { error: dbError } = await window.supabaseClient
    .from('materials')
    .delete()
    .eq('id', materialId);

  if (dbError) throw dbError;

  if (fileUrl && fileUrl.includes('/learning-materials/')) {
    const parts = fileUrl.split('/learning-materials/');
    if (parts.length > 1) {
      await window.supabaseClient.storage
        .from('learning-materials')
        .remove([parts[1]]);
    }
  }
  return true;
}

/**
 * Create quiz with questions
 */
async function createQuizWithQuestions(courseId, title, durationMinutes, questions) {
  if (!window.supabaseClient) throw new Error('Database not connected.');

  const { data: quiz, error: quizError } = await window.supabaseClient
    .from('quizzes')
    .insert([
      {
        course_id: courseId,
        title,
        duration_minutes: parseInt(durationMinutes, 10) || 15,
      },
    ])
    .select()
    .single();

  if (quizError) throw quizError;

  if (questions && questions.length > 0) {
    const formattedQuestions = questions.map((q) => ({
      quiz_id: quiz.id,
      question_text: q.question_text,
      option_a: q.option_a,
      option_b: q.option_b,
      option_c: q.option_c,
      option_d: q.option_d,
      correct_answer: q.correct_answer,
    }));

    const { error: qError } = await window.supabaseClient
      .from('questions')
      .insert(formattedQuestions);

    if (qError) throw qError;
  }

  return quiz;
}

/**
 * Fetch quizzes for a trainer
 */
async function getTrainerQuizzes(trainerId) {
  if (!window.supabaseClient || !trainerId) return [];

  const courses = await getTrainerCourses(trainerId);
  if (!courses || courses.length === 0) return [];

  const courseIds = courses.map((c) => c.id);

  const { data: quizzes, error } = await window.supabaseClient
    .from('quizzes')
    .select('*, course:courses(title), questions(count)')
    .in('course_id', courseIds)
    .order('created_at', { ascending: false });

  if (error) return [];
  return quizzes || [];
}

/**
 * Fetch enrolled students in trainer's courses
 */
async function getTrainerStudents(trainerId) {
  if (!window.supabaseClient || !trainerId) return [];

  const courses = await getTrainerCourses(trainerId);
  if (!courses || courses.length === 0) return [];

  const courseIds = courses.map((c) => c.id);

  const { data: enrollments, error } = await window.supabaseClient
    .from('enrollments')
    .select(`
      *,
      student:profiles!enrollments_student_id_fkey(full_name, email),
      course:courses(title)
    `)
    .in('course_id', courseIds)
    .order('enrolled_at', { ascending: false });

  if (error) return [];
  return enrollments || [];
}

/**
 * Fetch performance results across trainer's quizzes
 */
async function getTrainerResults(trainerId) {
  if (!window.supabaseClient || !trainerId) return [];

  const quizzes = await getTrainerQuizzes(trainerId);
  if (!quizzes || quizzes.length === 0) return [];

  const quizIds = quizzes.map((q) => q.id);

  const { data: results, error } = await window.supabaseClient
    .from('results')
    .select(`
      *,
      student:profiles!results_student_id_fkey(full_name, email),
      quiz:quizzes(title, course:courses(title))
    `)
    .in('quiz_id', quizIds)
    .order('attempted_at', { ascending: false });

  if (error) return [];
  return results || [];
}

window.getTrainerCourses = getTrainerCourses;
window.createCourse = createCourse;
window.deleteCourse = deleteCourse;
window.uploadLearningMaterial = uploadLearningMaterial;
window.getTrainerMaterials = getTrainerMaterials;
window.deleteMaterial = deleteMaterial;
window.createQuizWithQuestions = createQuizWithQuestions;
window.getTrainerQuizzes = getTrainerQuizzes;
window.getTrainerStudents = getTrainerStudents;
window.getTrainerResults = getTrainerResults;

