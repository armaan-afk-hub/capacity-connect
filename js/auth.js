// ==============================================================================
// CAPACITY CONNECT - Authentication Controller
// SIH26075 - Digital Capacity Building and Learning Management Portal
// ==============================================================================

/**
 * Handle user registration
 */
async function registerUser(fullName, email, password, confirmPassword, role) {
  if (!window.supabaseClient) {
    throw new Error('Supabase client is not ready. Please check credentials.');
  }

  // Validate inputs
  if (!fullName || !email || !password || !confirmPassword) {
    throw new Error('All fields are required.');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  if (password !== confirmPassword) {
    throw new Error('Passwords do not match.');
  }

  // Enforce role security: public registrations can only be 'student' or 'trainer'
  const assignedRole = role === 'trainer' ? 'trainer' : 'student';

  try {
    const { data, error } = await window.supabaseClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: assignedRole,
        },
      },
    });

    if (error) {
      if (error.message && error.message.toLowerCase().includes('rate limit')) {
        throw new Error(
          'Email rate limit exceeded by Supabase default mailer. Please disable "Confirm email" in Supabase Dashboard (Authentication -> Providers -> Email -> toggle off "Confirm email") to allow instant signups without sending confirmation emails.'
        );
      }
      throw error;
    }
    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Handle user login and determine role dashboard
 */
async function loginUser(email, password) {
  if (!window.supabaseClient) {
    throw new Error('Supabase client is not initialized.');
  }

  if (!email || !password) {
    throw new Error('Please enter both email and password.');
  }

  const { data, error } = await window.supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  // Query user profile to get verified role
  const { data: profile, error: profileError } = await window.supabaseClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', data.user.id)
    .single();

  if (profile && profile.is_active === false) {
    await window.supabaseClient.auth.signOut();
    throw new Error('This account has been deactivated by an administrator.');
  }

  const userRole = profile?.role || data.user.user_metadata?.role || 'student';
  return { user: data.user, role: userRole };
}

/**
 * Send password reset email
 */
async function requestPasswordReset(email) {
  if (!window.supabaseClient) {
    throw new Error('Supabase client is not initialized.');
  }

  if (!email) {
    throw new Error('Please provide your registered email address.');
  }

  const { data, error } = await window.supabaseClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/login.html`,
  });

  if (error) throw error;
  return data;
}

/**
 * Helper to route user to their respective dashboard
 */
function redirectToRoleDashboard(role) {
  if (role === 'admin') {
    window.location.href = 'admin-dashboard.html';
  } else if (role === 'trainer') {
    window.location.href = 'trainer-dashboard.html';
  } else {
    window.location.href = 'student-dashboard.html';
  }
}

window.registerUser = registerUser;
window.loginUser = loginUser;
window.requestPasswordReset = requestPasswordReset;
window.redirectToRoleDashboard = redirectToRoleDashboard;

