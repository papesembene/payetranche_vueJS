import { http } from './http.js';
import { subscriptionPlans } from '../data/subscriptionPlans.js';

const frontendPlanToBackend = (plan) => {
  const plans = {
    free: 'GRATUIT',
    gratuit: 'GRATUIT',
    essential: 'PRO',
    pro: 'PRO',
    enterprise: 'ENTREPRISE',
    entreprise: 'ENTREPRISE'
  };
  return plans[plan] || plan;
};

const backendPlanToFrontend = (plan) => {
  const plans = {
    GRATUIT: 'free',
    PRO: 'pro',
    ENTREPRISE: 'enterprise'
  };
  return plans[plan] || 'free';
};

class SubscriptionService {
  async getPlans() {
    return Object.values(subscriptionPlans);
  }

  async getPlan(planId) {
    return subscriptionPlans[planId] || subscriptionPlans.free;
  }

  async getCurrentSubscription() {
    try {
      const response = await http.get('/subscription/me');
      const data = response.data.data;
      return {
        id: `sub_${data.user.id}`,
        plan: backendPlanToFrontend(data.plan),
        status: data.status || 'active',
        price: data.price,
        planExpiresAt: data.planExpiresAt,
        currentPeriodEnd: data.planExpiresAt,
        usage: data.usage,
        limits: data.limits,
        features: data.features
      };
    } catch {
      return null;
    }
  }

  async updateSubscription(newPlanId) {
    return this.createCheckout(newPlanId);
  }

  async createCheckout(planId, options = {}) {
    const response = await http.post('/subscription/checkout', {
      plan: frontendPlanToBackend(planId),
      targetPayment: options.targetPayment || 'Orange Money, Wave'
    });

    return { success: true, checkout: response.data.data };
  }

  async createSubscription(planId) {
    return this.createCheckout(planId);
  }

  async getPayment(paymentId) {
    const response = await http.get(`/subscription/payments/${paymentId}`);
    return response.data.data;
  }

  async cancelSubscription() {
    throw new Error('Annulation non disponible pour le moment');
  }

  async reactivateSubscription() {
    return { success: true };
  }

  async getBillingHistory() {
    const response = await http.get('/subscription/history');
    return response.data.data || [];
  }

  async calculatePlanChange(currentPlanId, newPlanId) {
    const currentPlan = await this.getPlan(currentPlanId);
    const newPlan = await this.getPlan(newPlanId);
    return {
      currentPlan,
      newPlan,
      priceDifference: newPlan.price - currentPlan.price,
      proratedAmount: Math.max(0, newPlan.price - currentPlan.price),
      immediateCharge: newPlan.price > currentPlan.price
    };
  }

  async validateLimits(planId, usage) {
    const plan = await this.getPlan(planId);
    const violations = [];
    if (plan.limits?.maxClients !== -1 && usage.clients > plan.limits.maxClients) {
      violations.push(`Limite de clients dépassée (${usage.clients}/${plan.limits.maxClients})`);
    }
    return { valid: violations.length === 0, violations };
  }
}

export const subscriptionService = new SubscriptionService();
