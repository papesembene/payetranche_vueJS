import { http } from './http.js';

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
  onboardingCompleted: Boolean(user.onboardingCompleted),
  avatar: user.name?.charAt(0)?.toUpperCase() || 'U',
  subscription: {
    id: `sub_${user.id}`,
    plan: backendPlanToFrontend(user.plan),
    status: 'active',
    currentPeriodStart: user.createdAt || new Date().toISOString(),
    currentPeriodEnd: user.planExpiresAt || null,
    cancelAtPeriodEnd: false,
    trialEnd: null,
    recurringPayment: false
  },
  usage: user.usage || {
    clients: 0,
    payments: 0,
    totalAmount: 0
  }
});

const persistUser = (user) => {
  const safeUser = normalizeUser(user);
  localStorage.setItem('auth_user', JSON.stringify(safeUser));
  localStorage.setItem('user_data', JSON.stringify(safeUser));
  return safeUser;
};

class OnboardingService {
  async getStatus() {
    const response = await http.get('/onboarding/status');
    if (response.data.data?.user) {
      response.data.data.user = persistUser(response.data.data.user);
    }
    return response.data.data;
  }

  async complete(payload) {
    const response = await http.put('/onboarding/complete', payload);
    if (response.data.data?.user) {
      response.data.data.user = persistUser(response.data.data.user);
    }
    return response.data.data;
  }
}

export const onboardingService = new OnboardingService();
