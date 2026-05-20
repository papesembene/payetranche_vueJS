import { http } from './http.js';

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
      throw new Error(error.response?.data?.message || 'Erreur lors de la création du paiement PayTech');
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
      throw new Error(error.response?.data?.message || 'Simulation PayTech impossible');
    }
  }
}

export const paytechService = new PaytechService();
