// ==============================================================================
// CAPACITY CONNECT - Courses Controller & Service
// SIH26075 - Digital Capacity Building and Learning Management Portal
// ==============================================================================

/**
 * Fetch all approved courses with trainer information
 */
async function fetchApprovedCourses(category = 'all', searchQuery = '') {
  if (!window.supabaseClient) return [];

  let query = window.supabaseClient
    .from('courses')
    .select(`
      *,
      trainer:profiles!courses_trainer_id_fkey(full_name, organization, avatar_url)
    `)
    .eq('status', 'approved')
    .order('created_at', { ascending: false });

  if (category && category !== 'all') {
    query = query.eq('category', category);
  }

  if (searchQuery && searchQuery.trim()) {
    query = query.ilike('title', `%${searchQuery.trim()}%`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching approved courses:', error);
    return [];
  }
  return data || [];
}

/**
 * Fetch single course details
 */
async function fetchCourseDetails(courseId) {
  if (!window.supabaseClient || !courseId) return null;

  const { data, error } = await window.supabaseClient
    .from('courses')
    .select(`
      *,
      trainer:profiles!courses_trainer_id_fkey(full_name, email, organization, bio)
    `)
    .eq('id', courseId)
    .single();

  if (error) {
    console.error('Error fetching course:', error);
    return null;
  }
  return data;
}

/**
 * Check if current student is already enrolled in a course
 */
async function checkStudentEnrollment(studentId, courseId) {
  if (!window.supabaseClient || !studentId || !courseId) return false;

  const { data, error } = await window.supabaseClient
    .from('enrollments')
    .select('id, status, enrolled_at')
    .eq('student_id', studentId)
    .eq('course_id', courseId)
    .maybeSingle();

  if (error) return false;
  return data;
}

/**
 * Enroll student into a course
 */
async function enrollStudentInCourse(studentId, courseId) {
  if (!window.supabaseClient) throw new Error('Database not connected.');

  // Prevent duplicate enrollment
  const existing = await checkStudentEnrollment(studentId, courseId);
  if (existing) {
    throw new Error('You are already enrolled in this course.');
  }

  const { data, error } = await window.supabaseClient
    .from('enrollments')
    .insert([
      {
        student_id: studentId,
        course_id: courseId,
        status: 'enrolled',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch materials associated with a course
 */
async function fetchCourseMaterials(courseId) {
  if (!window.supabaseClient || !courseId) return [];

  const { data, error } = await window.supabaseClient
    .from('materials')
    .select('*')
    .eq('course_id', courseId)
    .order('uploaded_at', { ascending: false });

  if (error) return [];
  return data || [];
}

/**
 * Fetch quizzes associated with a course
 */
async function fetchCourseQuizzes(courseId) {
  if (!window.supabaseClient || !courseId) return [];

  const { data, error } = await window.supabaseClient
    .from('quizzes')
    .select('*, questions(count)')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

window.fetchApprovedCourses = fetchApprovedCourses;
window.fetchCourseDetails = fetchCourseDetails;
window.checkStudentEnrollment = checkStudentEnrollment;
window.enrollStudentInCourse = enrollStudentInCourse;
window.fetchCourseMaterials = fetchCourseMaterials;
window.fetchCourseQuizzes = fetchCourseQuizzes;

