import { http } from './http.js';
import { getUserFriendlyError } from '../utils/userFriendlyError.js';

class PaytechService {
  async createCreditPayment(creditId, data = {}) {
    try {
      const response = await http.post(`/paytech/credits/${creditId}/request-payment`, {
        amount: data.amount ? Number(data.amount) : undefined,
        installmentId: data.installmentId,
        targetPayment: data.targetPayment || 'Orange Money, Wave',
        clientPhone: data.clientPhone
      });

      return response.data.data;
    } catch (error) {
      throw new Error(getUserFriendlyError(error, 'payment'));
    }
  }

  async getPaymentRequest(paymentRequestId) {
    const response = await http.get(`/paytech/payments/${paymentRequestId}`);
    return response.data.data;
  }

  async simulatePayment(paymentRequestId) {
    try {
      const response = await http.post(`/paytech/payments/${paymentRequestId}/simulate`);
      return response.data.data;
    } catch (error) {
      throw new Error(getUserFriendlyError(error, 'payment'));
    }
  }
}

export const paytechService = new PaytechService();
