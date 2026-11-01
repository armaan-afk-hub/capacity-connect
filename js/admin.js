// ==============================================================================
// CAPACITY CONNECT - Administrator Controller
// SIH26075 - Digital Capacity Building and Learning Management Portal
// ==============================================================================

/**
 * Fetch platform-wide statistics for the admin dashboard
 */
async function getAdminPlatformStats() {
  if (!window.supabaseClient) return null;

  try {
    const [profilesRes, coursesRes, enrollmentsRes, quizzesRes] = await Promise.all([
      window.supabaseClient.from('profiles').select('role'),
      window.supabaseClient.from('courses').select('status'),
      window.supabaseClient.from('enrollments').select('*', { count: 'exact', head: true }),
      window.supabaseClient.from('quizzes').select('*', { count: 'exact', head: true }),
    ]);

    const profiles = profilesRes.data || [];
    const courses = coursesRes.data || [];

    const totalStudents = profiles.filter((p) => p.role === 'student').length;
    const totalTrainers = profiles.filter((p) => p.role === 'trainer').length;
    const pendingCourses = courses.filter((c) => c.status === 'pending').length;
    const approvedCourses = courses.filter((c) => c.status === 'approved').length;

    return {
      totalStudents,
      totalTrainers,
      totalCourses: courses.length,
      pendingCourses,
      approvedCourses,
      totalEnrollments: enrollmentsRes.count || 0,
      totalQuizzes: quizzesRes.count || 0,
    };
  } catch (err) {
    console.error('Error fetching admin platform stats:', err);
    return null;
  }
}

/**
 * Fetch pending courses awaiting admin approval
 */
async function getPendingCourses() {
  if (!window.supabaseClient) return [];

  const { data, error } = await window.supabaseClient
    .from('courses')
    .select('*, trainer:profiles!courses_trainer_id_fkey(full_name, email, organization)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) return [];
  return data || [];
}

/**
 * Approve a course
 */
async function approveCourse(courseId) {
  if (!window.supabaseClient) throw new Error('Database not connected.');

  const { data, error } = await window.supabaseClient
    .from('courses')
    .update({ status: 'approved' })
    .eq('id', courseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Reject a course
 */
async function rejectCourse(courseId) {
  if (!window.supabaseClient) throw new Error('Database not connected.');

  const { data, error } = await window.supabaseClient
    .from('courses')
    .update({ status: 'rejected' })
    .eq('id', courseId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch users by role
 */
async function getUsersByRole(role) {
  if (!window.supabaseClient) return [];

  let query = window.supabaseClient.from('profiles').select('*');
  if (role) {
    query = query.eq('role', role);
  }
  query = query.order('created_at', { ascending: false });

  const { data, error } = await query;
  if (error) return [];
  return data || [];
}

/**
 * Toggle user account status (active/deactive)
 */
async function toggleUserStatus(userId, isActive) {
  if (!window.supabaseClient) throw new Error('Database not connected.');

  const { data, error } = await window.supabaseClient
    .from('profiles')
    .update({ is_active: isActive })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetch all courses for master admin view
 */
async function getAllCoursesAdmin() {
  if (!window.supabaseClient) return [];

  const { data, error } = await window.supabaseClient
    .from('courses')
    .select('*, trainer:profiles!courses_trainer_id_fkey(full_name), enrollments(count)')
    .order('created_at', { ascending: false });

  if (error) return [];
  return data || [];
}

/**
 * Create announcement
 */
async function postAnnouncement(title, message, adminId) {
  if (!window.supabaseClient) throw new Error('Database not connected.');

  const { data, error } = await window.supabaseClient
    .from('announcements')
    .insert([
      {
        title,
        message,
        created_by: adminId,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete announcement
 */
async function deleteAnnouncement(id) {
  if (!window.supabaseClient) throw new Error('Database not connected.');

  const { error } = await window.supabaseClient
    .from('announcements')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

window.getAdminPlatformStats = getAdminPlatformStats;
window.getPendingCourses = getPendingCourses;
window.approveCourse = approveCourse;
window.rejectCourse = rejectCourse;
window.getUsersByRole = getUsersByRole;
window.toggleUserStatus = toggleUserStatus;
window.getAllCoursesAdmin = getAllCoursesAdmin;
window.postAnnouncement = postAnnouncement;
window.deleteAnnouncement = deleteAnnouncement;

