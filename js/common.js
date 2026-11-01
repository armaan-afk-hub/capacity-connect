// ==============================================================================
// CAPACITY CONNECT - Common Utilities, Auth Helpers & UI Components
// SIH26075 - Digital Capacity Building and Learning Management Portal
// ==============================================================================

/**
 * Show a toast notification
 * @param {string} message - Notification text
 * @param {'success'|'danger'|'warning'|'info'} type - Bootstrap color variant
 */
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    toastContainer.style.zIndex = '1090';
    document.body.appendChild(toastContainer);
  }

  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center text-bg-${type} border-0 show shadow-lg mb-2`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');

  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body d-flex align-items-center gap-2">
        <i class="bi ${type === 'success' ? 'bi-check-circle-fill' : type === 'danger' ? 'bi-exclamation-triangle-fill' : 'bi-info-circle-fill'}"></i>
        <span>${message}</span>
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

  toastContainer.appendChild(toastEl);

  setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.remove(), 300);
  }, 4500);
}

/**
 * Get currently authenticated session
 */
async function getCurrentSession() {
  if (!window.supabaseClient) return null;
  const { data: { session }, error } = await window.supabaseClient.auth.getSession();
  if (error || !session) return null;
  return session;
}

/**
 * Get current user with role profile
 */
async function getCurrentUserProfile() {
  const session = await getCurrentSession();
  if (!session || !session.user) return null;

  try {
    const { data: profile, error } = await window.supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.warn('Could not load profile from database:', error.message);
      return {
        id: session.user.id,
        email: session.user.email,
        full_name: session.user.user_metadata?.full_name || 'User',
        role: session.user.user_metadata?.role || 'student'
      };
    }
    return profile;
  } catch (e) {
    return null;
  }
}

/**
 * Guard protected pages based on user role
 * @param {Array<string>} allowedRoles - e.g. ['student'], ['trainer'], ['admin']
 */
async function checkAuthGuard(allowedRoles = []) {
  const session = await getCurrentSession();
  if (!session) {
    window.location.href = 'login.html';
    return null;
  }

  const profile = await getCurrentUserProfile();
  const userRole = profile?.role || 'student';

  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect to correct dashboard
    if (userRole === 'admin') window.location.href = 'admin-dashboard.html';
    else if (userRole === 'trainer') window.location.href = 'trainer-dashboard.html';
    else window.location.href = 'student-dashboard.html';
    return null;
  }

  return { session, profile, role: userRole };
}

/**
 * Log out user and redirect to login page
 */
async function logoutUser() {
  if (window.supabaseClient) {
    await window.supabaseClient.auth.signOut();
  }
  window.location.href = 'login.html';
}

/**
 * Update navigation bar according to logged in state
 */
async function syncNavbarState() {
  const authNav = document.getElementById('authNavButtons');
  if (!authNav) return;

  const profile = await getCurrentUserProfile();
  if (profile) {
    const dashboardUrl =
      profile.role === 'admin'
        ? 'admin-dashboard.html'
        : profile.role === 'trainer'
        ? 'trainer-dashboard.html'
        : 'student-dashboard.html';

    authNav.innerHTML = `
      <div class="d-flex align-items-center gap-2">
        <a href="${dashboardUrl}" class="btn btn-sm btn-navy d-flex align-items-center gap-1.5 px-3 py-1.5 rounded-3">
          <i class="bi bi-grid-fill text-teal"></i>
          <span>Dashboard</span>
          <span class="badge bg-teal-light text-dark ms-1 text-uppercase" style="font-size: 0.65rem;">${profile.role}</span>
        </a>
        <button onclick="logoutUser()" class="btn btn-sm btn-outline-danger px-2.5 py-1.5 rounded-3" title="Log out">
          <i class="bi bi-box-arrow-right"></i>
        </button>
      </div>
    `;
  }
}

// Automatically sync navigation bar on page load
document.addEventListener('DOMContentLoaded', () => {
  syncNavbarState();
});

window.showToast = showToast;
window.getCurrentSession = getCurrentSession;
window.getCurrentUserProfile = getCurrentUserProfile;
window.checkAuthGuard = checkAuthGuard;
window.logoutUser = logoutUser;
window.syncNavbarState = syncNavbarState;

