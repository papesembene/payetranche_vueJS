export const getPlatformAdminEmails = () =>
  (import.meta.env.VITE_PLATFORM_ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export const isExplicitPlatformAdmin = (user) =>
  getPlatformAdminEmails().includes(user?.email?.toLowerCase());

export const canAccessPlatformAdmin = (user) =>
  isExplicitPlatformAdmin(user) || import.meta.env.VITE_ALLOW_DEV_ADMIN === 'true';

export const getSafeRedirectPath = (redirect) => {
  if (typeof redirect !== 'string') return '';
  if (!redirect.startsWith('/') || redirect.startsWith('//')) return '';
  if (redirect === '/login' || redirect === '/register') return '';
  return redirect;
};

export const getPostAuthPath = (user, redirectPath = '') => {
  if (isExplicitPlatformAdmin(user)) return '/admin';
  if (!user?.onboardingCompleted) return '/onboarding';
  return redirectPath || '/dashboard';
};
