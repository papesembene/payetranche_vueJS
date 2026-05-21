import { http } from './http.js';
import { getUserFriendlyError } from '../utils/userFriendlyError.js';

const backendPlanToFrontend = (plan) => {
  const plans = {
    GRATUIT: 'free',
    PRO: 'pro',
    ENTREPRISE: 'enterprise'
  };
  return plans[plan] || 'free';
};

const normalizeUser = (user) => ({
  ...user,
  phone: user.phone || (user.email?.endsWith('@paytranche.local') ? user.email.replace('@paytranche.local', '') : ''),
  onboardingCompleted: Boolean(user.onboardingCompleted),
  avatar: user.name?.charAt(0)?.toUpperCase() || 'U',
  subscription: {
    id: `sub_${user.id}`,
    plan: backendPlanToFrontend(user.plan),
    status: 'active',
    currentPeriodStart: user.createdAt || new Date().toISOString(),
    currentPeriodEnd: user.planExpiresAt || null,
    cancelAtPeriodEnd: false,
    trialEnd: null
  },
  usage: user.usage || {
    clients: 0,
    payments: 0,
    totalAmount: 0
  }
});

class UserService {
  async getProfile() {
    try {
      const response = await http.get('/auth/me');
      const user = normalizeUser(response.data.data.user);
      localStorage.setItem('auth_user', JSON.stringify(user));
      return user;
    } catch (error) {
      const cached = localStorage.getItem('auth_user');
      if (cached) return JSON.parse(cached);
      throw new Error(getUserFriendlyError(error, 'load'));
    }
  }

  async updateProfile(profileData) {
    const current = await this.getProfile();
    const updated = { ...current, ...profileData };
    localStorage.setItem('auth_user', JSON.stringify(updated));
    localStorage.setItem('user_data', JSON.stringify(updated));
    return updated;
  }

  async updateUsage(usageData) {
    const current = await this.getProfile();
    const updated = { ...current, usage: { ...current.usage, ...usageData } };
    localStorage.setItem('auth_user', JSON.stringify(updated));
    localStorage.setItem('user_data', JSON.stringify(updated));
    return updated;
  }

  async getStatistics() {
    const response = await http.get('/analytics/dashboard');
    return response.data.data;
  }

  async exportData() {
    return {
      user: await this.getProfile(),
      exportedAt: new Date().toISOString()
    };
  }

  async updatePreferences(preferences) {
    const current = await this.getProfile();
    const updated = { ...current, preferences };
    localStorage.setItem('auth_user', JSON.stringify(updated));
    return updated;
  }

  async getPreferences() {
    return {
      language: 'fr',
      timezone: 'Africa/Dakar',
      notifications: { email: true, push: true, sms: false },
      theme: 'light'
    };
  }
}

export const userService = new UserService();
