import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import LoginPage from '../views/LoginPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import OnboardingPage from '../views/OnboardingPage.vue';
import AdminPage from '../views/AdminPage.vue';
import DashboardPage from '../views/DashboardPage.vue';
import SettingsPage from '../views/SettingsPage.vue';
import PaymentSuccessPage from '../views/PaymentSuccessPage.vue';
import PaymentCancelPage from '../views/PaymentCancelPage.vue';
import { canAccessPlatformAdmin, isExplicitPlatformAdmin } from '../utils/access.js';

// Navigation guard for authentication and subscription checks
const readStoredUser = () => {
  const userData = localStorage.getItem('auth_user');

  if (userData) {
    try {
      const user = JSON.parse(userData);
      if (user && user.id) {
        return user;
      }
    } catch (error) {
      console.warn('❌ Invalid user data in localStorage');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('user_data');
    }
  }

  return null;
};

const redirectToLogin = (to, next) => {
  console.warn('⚠️ Utilisateur non authentifié, redirection vers login');
  next({
    path: '/login',
    query: { redirect: to.fullPath }
  });
};

const handleIncompleteOnboarding = (user, to, next) => {
  if (to.path !== '/onboarding' && user.onboardingCompleted === false) {
    localStorage.setItem('post_onboarding_redirect', to.fullPath);
    next('/onboarding');
    return true;
  }

  return false;
};

const requireAuth = (to, from, next) => {
  const user = readStoredUser();

  if (!user) {
    redirectToLogin(to, next);
    return;
  }

  if (isExplicitPlatformAdmin(user)) {
    next('/admin');
    return;
  }

  if (handleIncompleteOnboarding(user, to, next)) return;

  next();
};

const requirePlatformAdmin = (to, from, next) => {
  const user = readStoredUser();

  if (!user) {
    redirectToLogin(to, next);
    return;
  }

  if (!canAccessPlatformAdmin(user)) {
    next('/dashboard');
    return;
  }

  next();
};

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomePage
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterPage
  },
  {
    path: '/onboarding',
    name: 'Onboarding',
    component: OnboardingPage,
    beforeEnter: requireAuth
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage,
    beforeEnter: requireAuth
  },
  {
    path: '/admin',
    name: 'Admin',
    component: AdminPage,
    beforeEnter: requirePlatformAdmin
  },
  {
    path: '/settings',
    name: 'Settings',
    component: SettingsPage,
    beforeEnter: requireAuth
  },
  {
    path: '/payment/success',
    name: 'PaymentSuccess',
    component: PaymentSuccessPage
  },
  {
    path: '/payment/cancel',
    name: 'PaymentCancel',
    component: PaymentCancelPage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else if (to.hash) {
      return {
        el: to.hash,
        behavior: 'smooth'
      };
    } else {
      return { top: 0 };
    }
  }
});

export default router;
