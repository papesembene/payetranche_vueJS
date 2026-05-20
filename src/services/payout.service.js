import { http } from './http.js';

class PayoutService {
  async getProfile() {
    const response = await http.get('/payout/profile');
    return response.data.data || [];
  }

  async saveProfile(profile) {
    const response = await http.put('/payout/profile', {
      operator: profile.operator,
      phone: profile.phone,
      holderName: profile.holderName,
      isDefault: Boolean(profile.isDefault)
    });
    return response.data.data;
  }

  async getWallet() {
    const response = await http.get('/payout/wallet');
    return response.data.data;
  }

  async getPayouts(filters = {}) {
    const response = await http.get('/payout/payouts', { params: filters });
    return response.data.data || [];
  }
}

export const payoutService = new PayoutService();
