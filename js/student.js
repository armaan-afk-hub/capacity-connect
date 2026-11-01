// ==============================================================================
// CAPACITY CONNECT - Student Controller
// SIH26075 - Digital Capacity Building and Learning Management Portal
// ==============================================================================

/**
 * Fetch all enrolled courses for a student
 */
async function getStudentEnrollments(studentId) {
  if (!window.supabaseClient || !studentId) return [];

  const { data, error } = await window.supabaseClient
    .from('enrollments')
    .select(`
      *,
      course:courses(
        id, title, description, category, duration, thumbnail_url,
        trainer:profiles!courses_trainer_id_fkey(full_name)
      )
    `)
    .eq('student_id', studentId)
    .order('enrolled_at', { ascending: false });

  if (error) {
    console.error('Error fetching student enrollments:', error);
    return [];
  }
  return data || [];
}

/**
 * Fetch learning materials for courses student is enrolled in
 */
async function getStudentMaterials(studentId) {
  if (!window.supabaseClient || !studentId) return [];

  const { data: enrollments, error: enrollError } = await window.supabaseClient
    .from('enrollments')
    .select('course_id')
    .eq('student_id', studentId);

  if (enrollError || !enrollments || enrollments.length === 0) return [];

  const courseIds = enrollments.map(e => e.course_id);

  const { data: materials, error: matError } = await window.supabaseClient
    .from('materials')
    .select(`
      *,
      course:courses(id, title, category)
    `)
    .in('course_id', courseIds)
    .order('uploaded_at', { ascending: false });

  if (matError) return [];
  return materials || [];
}

/**
 * Fetch available quizzes from enrolled courses
 */
async function getStudentQuizzes(studentId) {
  if (!window.supabaseClient || !studentId) return [];

  const { data: enrollments, error: enrollError } = await window.supabaseClient
    .from('enrollments')
    .select('course_id')
    .eq('student_id', studentId);

  if (enrollError || !enrollments || enrollments.length === 0) return [];

  const courseIds = enrollments.map(e => e.course_id);

  const { data: quizzes, error: quizError } = await window.supabaseClient
    .from('quizzes')
    .select(`
      *,
      course:courses(title, category)
    `)
    .in('course_id', courseIds)
    .order('created_at', { ascending: false });

  if (quizError) return [];
  return quizzes || [];
}

/**
 * Fetch quiz with questions for student attempt
 */
async function getQuizWithQuestions(quizId) {
  if (!window.supabaseClient || !quizId) return null;

  const { data: quiz, error: quizError } = await window.supabaseClient
    .from('quizzes')
    .select('*, course:courses(title)')
    .eq('id', quizId)
    .single();

  if (quizError) return null;

  const { data: questions, error: qError } = await window.supabaseClient
    .from('questions')
    .select('id, question_text, option_a, option_b, option_c, option_d')
    .eq('quiz_id', quizId);

  if (qError) return null;

  return { ...quiz, questions: questions || [] };
}

/**
 * Submit quiz answers, evaluate score, and save into results table
 */
async function submitQuiz(studentId, quizId, userAnswers) {
  if (!window.supabaseClient) throw new Error('Database not connected.');

  // Fetch correct answers for grading
  const { data: questions, error } = await window.supabaseClient
    .from('questions')
    .select('id, correct_answer')
    .eq('quiz_id', quizId);

  if (error || !questions) throw new Error('Could not retrieve evaluation keys.');

  let score = 0;
  const totalMarks = questions.length;

  questions.forEach(q => {
    if (userAnswers[q.id] && userAnswers[q.id].toUpperCase() === q.correct_answer.toUpperCase()) {
      score += 1;
    }
  });

  const { data: result, error: resError } = await window.supabaseClient
    .from('results')
    .insert([
      {
        student_id: studentId,
        quiz_id: quizId,
        score,
        total_marks: totalMarks
      }
    ])
    .select()
    .single();

  if (resError) throw resError;
  return { score, totalMarks, result };
}

/**
 * Fetch student quiz results
 */
async function getStudentResults(studentId) {
  if (!window.supabaseClient || !studentId) return [];

  const { data, error } = await window.supabaseClient
    .from('results')
    .select(`
      *,
      quiz:quizzes(title, course:courses(title))
    `)
    .eq('student_id', studentId)
    .order('attempted_at', { ascending: false });

  if (error) return [];
  return data || [];
}

/**
 * Fetch announcements
 */
async function getAnnouncements() {
  if (!window.supabaseClient) return [];

  const { data, error } = await window.supabaseClient
    .from('announcements')
    .select('*, author:profiles!announcements_created_by_fkey(full_name, role)')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

window.getStudentEnrollments = getStudentEnrollments;
window.getStudentMaterials = getStudentMaterials;
window.getStudentQuizzes = getStudentQuizzes;
window.getQuizWithQuestions = getQuizWithQuestions;
window.submitQuiz = submitQuiz;
window.getStudentResults = getStudentResults;
window.getAnnouncements = getAnnouncements;

