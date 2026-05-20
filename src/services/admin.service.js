import { http } from './http.js';

class AdminService {
  async getOverview() {
    const response = await http.get('/admin/overview');
    return response.data.data;
  }

  async getTenants(search = '') {
    const response = await http.get('/admin/tenants', {
      params: search ? { search } : {}
    });
    return response.data.data || [];
  }

  async getSubscriptionPayments() {
    const response = await http.get('/admin/subscription-payments');
    return response.data.data || [];
  }

  async getPaymentConfig() {
    const response = await http.get('/admin/payment-config');
    return response.data.data;
  }

  async getPayouts(filters = {}) {
    const params = {};
    if (filters.search) params.search = filters.search;
    if (filters.status && filters.status !== 'ALL') params.status = filters.status;

    const response = await http.get('/admin/payouts', { params });
    return response.data.data || [];
  }

  async updateTenantStatus(tenantId, isActive) {
    const response = await http.patch(`/admin/tenants/${tenantId}/status`, { isActive });
    return response.data.data;
  }

  async updateUserPlan(userId, plan, planExpiresAt = null) {
    const response = await http.patch(`/admin/users/${userId}/plan`, {
      plan,
      planExpiresAt
    });
    return response.data.data;
  }

  async syncPayout(payoutId) {
    const response = await http.post(`/admin/payouts/${payoutId}/sync`);
    return response.data.data;
  }

  async sendPayout(payoutId) {
    const response = await http.post(`/admin/payouts/${payoutId}/send`);
    return response.data.data;
  }

  async updatePayoutDestination(payoutId, destination) {
    const response = await http.patch(`/admin/payouts/${payoutId}/destination`, destination);
    return response.data.data;
  }

  async markPayoutManual(payoutId, data) {
    const response = await http.post(`/admin/payouts/${payoutId}/manual-paid`, data);
    return response.data.data;
  }
}

export const adminService = new AdminService();
