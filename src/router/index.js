import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import LoginPage from '../views/LoginPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import DashboardPage from '../views/DashboardPage.vue';
import SettingsPage from '../views/SettingsPage.vue';
import PaymentSuccessPage from '../views/PaymentSuccessPage.vue';
import { useUserStore } from '../stores/user.js';

// Navigation guard for authentication and subscription checks
const requireAuth = (to, from, next) => {
  const userStore = useUserStore();

  // Check if user is authenticated
  if (!userStore.isAuthenticated) {
    next('/login');
    return;
  }

  // Check if subscription is expired
  if (userStore.isSubscriptionExpired) {
    // Allow access to settings for upgrading, but redirect dashboard to home with message
    if (to.name === 'Dashboard') {
      // Could show a modal or redirect to upgrade page
      // For now, allow access but components will show restrictions
      next();
    } else {
      next();
    }
  } else {
    next();
  }
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
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardPage,
    beforeEnter: requireAuth
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