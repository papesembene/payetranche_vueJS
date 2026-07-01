import { http } from './http.js';
import { getUserFriendlyError } from '../utils/userFriendlyError.js';

const normalizeEntry = (entry) => ({
  ...entry,
  displayType:
    entry.type === 'SALE'
      ? 'Encaissement client'
      : entry.type === 'SUPPLIER_PURCHASE'
        ? 'Achat'
        : 'Dépense',
  displayStatus:
    entry.paymentStatus === 'PAID'
      ? 'Payé'
      : entry.paymentStatus === 'PARTIAL'
        ? 'Partiel'
        : 'À payer',
});

class BusinessService {
  async getSummary() {
    try {
      const response = await http.get('/business/summary');
      return response.data.data;
    } catch (error) {
      throw new Error(getUserFriendlyError(error, 'load'));
    }
  }

  async getEntries(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.type) params.set('type', filters.type);
      if (filters.supplierId) params.set('supplierId', filters.supplierId);
      const response = await http.get(`/business/entries?${params.toString()}`);
      return response.data.data.map(normalizeEntry);
    } catch (error) {
      throw new Error(getUserFriendlyError(error, 'load'));
    }
  }

  async createEntry(data) {
    try {
      const payload = {
        type: data.type,
        title: data.title,
        amount: Number(data.amount),
        note: data.note || undefined,
        occurredAt: data.occurredAt ? new Date(data.occurredAt).toISOString() : undefined,
      };

      if (data.type === 'SUPPLIER_PURCHASE') {
        payload.paidAmount = Number(data.paidAmount || 0);
        payload.supplierId = data.supplierId || undefined;
        payload.supplierName = data.supplierName || undefined;
        payload.supplierPhone = data.supplierPhone || undefined;
      }

      const response = await http.post('/business/entries', payload);
      return normalizeEntry(response.data.data);
    } catch (error) {
      throw new Error(getUserFriendlyError(error, 'save'));
    }
  }

  async deleteEntry(id) {
    try {
      await http.delete(`/business/entries/${id}`);
      return { success: true };
    } catch (error) {
      throw new Error(getUserFriendlyError(error, 'save'));
    }
  }

  async getSuppliers() {
    try {
      const response = await http.get('/business/suppliers');
      return response.data.data;
    } catch (error) {
      throw new Error(getUserFriendlyError(error, 'load'));
    }
  }
}

export const businessService = new BusinessService();
