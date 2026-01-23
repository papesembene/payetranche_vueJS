import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../views/HomePage.vue';
import LoginPage from '../views/LoginPage.vue';
import RegisterPage from '../views/RegisterPage.vue';
import DashboardPage from '../views/DashboardPage.vue';
import SettingsPage from '../views/SettingsPage.vue';
import PaymentSuccessPage from '../views/PaymentSuccessPage.vue';
import { useUserStore } from '../stores/user.js';
import { authService } from '../services/auth.service.js';

// Navigation guard for authentication and subscription checks
const requireAuth = (to, from, next) => {
  // Vérifier d'abord le localStorage pour une détection rapide
  const userData = localStorage.getItem('auth_user');
  
  if (userData) {
    try {
      const user = JSON.parse(userData);
      if (user && user.id) {
        // Utilisateur trouvé dans localStorage
        next();
        return;
      }
    } catch (error) {
      console.warn('❌ Invalid user data in localStorage');
      localStorage.removeItem('auth_user');
      localStorage.removeItem('user_data');
    }
  }

  // Pas d'authentification trouvée
  console.warn('⚠️ Utilisateur non authentifié, redirection vers login');
  next('/login');
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