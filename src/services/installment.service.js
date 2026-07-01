import { http } from './http.js';
import { getUserFriendlyError } from '../utils/userFriendlyError.js';

const normalizeInstallment = (installment) => ({
  ...installment,
  status: installment.status,
  displayStatus:
    installment.status === 'PAYEE'
      ? 'Payée'
      : installment.status === 'EN_RETARD'
        ? 'En retard'
        : 'À venir'
});

class InstallmentService {
  async getInstallments(filters = {}) {
    const params = new URLSearchParams();
    if (filters.creditId) params.set('creditId', filters.creditId);
    if (filters.clientId) params.set('clientId', filters.clientId);
    if (filters.status) params.set('status', filters.status);

    const response = await http.get(`/installments?${params.toString()}`);
    return response.data.data.map(normalizeInstallment);
  }

  async createPlan(creditId, data) {
    const response = await http.post(`/installments/credits/${creditId}/plan`, {
      count: Number(data.count),
      firstDueDate: new Date(data.firstDueDate).toISOString(),
      frequency: data.frequency || 'MONTHLY'
    });
    return response.data.data.map(normalizeInstallment);
  }

  async payInstallment(installmentId, data = {}) {
    try {
      const response = await http.post(`/installments/${installmentId}/pay`, {
        amount: data.amount ? Number(data.amount) : undefined,
        method: data.method,
        reference: data.reference
      });
      return response.data.data;
    } catch (error) {
      throw new Error(getUserFriendlyError(error, 'payment'));
    }
  }

  async payMultipleInstallments(creditId, data) {
    try {
      const response = await http.post(`/installments/credits/${creditId}/pay-multiple`, {
        installmentIds: data.installmentIds,
        method: data.method,
        reference: data.reference
      });
      return response.data.data;
    } catch (error) {
      throw new Error(getUserFriendlyError(error, 'payment'));
    }
  }

  async scanOverdue() {
    const response = await http.post('/installments/scan-overdue');
    return response.data.data.map(normalizeInstallment);
  }
}

export const installmentService = new InstallmentService();
