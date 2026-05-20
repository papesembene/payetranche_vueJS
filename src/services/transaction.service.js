import { http } from './http.js';

const creditStatusToTransaction = (status) => {
  if (status === 'PAYE') return 'completed';
  if (status === 'EN_RETARD') return 'pending';
  return 'pending';
};

const normalizeCredit = (credit) => ({
  id: credit.id,
  backendType: 'credit',
  clientId: credit.clientId,
  amount: credit.remainingAmount ?? credit.amount,
  originalAmount: credit.amount,
  paidAmount: credit.paidAmount || 0,
  remainingAmount: credit.remainingAmount ?? Math.max((credit.amount || 0) - (credit.paidAmount || 0), 0),
  description: credit.description || 'Crédit client',
  dueDate: credit.dueDate,
  status: creditStatusToTransaction(credit.status),
  type: 'payment',
  createdAt: credit.createdAt,
  updatedAt: credit.updatedAt
});

const normalizePayment = (payment) => ({
  id: payment.id,
  backendType: 'payment',
  clientId: payment.clientId,
  creditId: payment.creditId,
  amount: payment.amount,
  description: payment.reference || 'Paiement reçu',
  dueDate: null,
  paymentDate: payment.paidAt,
  status: payment.status === 'COMPLETED' ? 'completed' : 'pending',
  type: 'payment',
  createdAt: payment.createdAt,
  updatedAt: payment.updatedAt
});

class TransactionService {
  async getTransactions(filters = {}) {
    try {
      const [creditsResponse, paymentsResponse] = await Promise.all([
        http.get('/credits?includePaid=true'),
        http.get('/payments')
      ]);

      let transactions = [
        ...creditsResponse.data.data.map(normalizeCredit),
        ...paymentsResponse.data.data.map(normalizePayment)
      ];

      if (filters.clientId) {
        transactions = transactions.filter((transaction) => transaction.clientId === filters.clientId);
      }

      if (filters.status) {
        transactions = transactions.filter((transaction) => transaction.status === filters.status);
      }

      return transactions.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des transactions');
    }
  }

  async getTransaction(transactionId) {
    try {
      const response = await http.get(`/credits/${transactionId}`);
      return normalizeCredit(response.data.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de la transaction');
    }
  }

  async getCreditTimeline(creditId) {
    try {
      const response = await http.get(`/credits/${creditId}/timeline`);
      return response.data.data || [];
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement de l’historique');
    }
  }

  async createTransaction(transactionData) {
    try {
      if (transactionData.status === 'completed') {
        let creditId = transactionData.creditId;

        if (!creditId) {
          const creditsResponse = await http.get(`/credits?clientId=${transactionData.clientId}`);
          const openCredit = creditsResponse.data.data.find((credit) => credit.remainingAmount > 0);
          creditId = openCredit?.id;
        }

        if (!creditId) {
          throw new Error('Aucun crédit actif trouvé pour ce client');
        }

        const response = await http.post('/payments', {
          clientId: transactionData.clientId,
          creditId,
          amount: Number(transactionData.amount),
          method: 'CASH',
          status: 'COMPLETED',
          reference: transactionData.description
        });
        return normalizePayment(response.data.data);
      }

      const response = await http.post('/credits', {
        clientId: transactionData.clientId,
        amount: Number(transactionData.amount),
        paidAmount: 0,
        description: transactionData.description,
        dueDate: transactionData.dueDate
          ? new Date(transactionData.dueDate).toISOString()
          : undefined
      });

      return normalizeCredit(response.data.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création de la transaction');
    }
  }

  async updateTransaction(transactionId, transactionData) {
    try {
      const payload = {};
      if (transactionData.amount !== undefined) payload.amount = Number(transactionData.amount);
      if (transactionData.description !== undefined) payload.description = transactionData.description;
      if (transactionData.dueDate !== undefined) {
        payload.dueDate = transactionData.dueDate ? new Date(transactionData.dueDate).toISOString() : null;
      }
      if (transactionData.status === 'completed') payload.status = 'PAYE';

      const response = await http.patch(`/credits/${transactionId}`, payload);
      return normalizeCredit(response.data.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour de la transaction');
    }
  }

  async deleteTransaction(transactionId) {
    try {
      await http.delete(`/credits/${transactionId}`);
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression de la transaction');
    }
  }

  async markAsPaid(transactionId, paymentData = {}) {
    try {
      const creditResponse = await http.get(`/credits/${transactionId}`);
      const credit = creditResponse.data.data;
      const amount = Number(paymentData.amount || credit.remainingAmount || credit.amount);

      const response = await http.post('/payments', {
        clientId: credit.clientId,
        creditId: credit.id,
        amount,
        method: 'CASH',
        status: 'COMPLETED',
        reference: paymentData.description || 'Paiement'
      });

      return normalizePayment(response.data.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du marquage comme payé');
    }
  }

  async getOverdueTransactions() {
    const transactions = await this.getTransactions({ status: 'pending' });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return transactions.filter((transaction) => {
      if (!transaction.dueDate) return false;
      const dueDate = new Date(transaction.dueDate);
      dueDate.setHours(0, 0, 0, 0);
      return dueDate < today;
    });
  }

  async getTransactionStats(dateRange = {}) {
    const transactions = await this.getTransactions(dateRange);
    const completed = transactions.filter((transaction) => transaction.status === 'completed');
    const pending = transactions.filter((transaction) => transaction.status === 'pending');
    const overdue = await this.getOverdueTransactions();

    return {
      total: transactions.length,
      completed: completed.length,
      pending: pending.length,
      overdue: overdue.length,
      totalAmount: transactions.reduce((sum, transaction) => sum + (transaction.amount || 0), 0),
      completedAmount: completed.reduce((sum, transaction) => sum + (transaction.amount || 0), 0),
      pendingAmount: pending.reduce((sum, transaction) => sum + (transaction.amount || 0), 0)
    };
  }

  async getTransactionsByClient(clientId) {
    return this.getTransactions({ clientId });
  }

  async exportTransactions() {
    throw new Error('Export non disponible via le backend pour le moment');
  }
}

export const transactionService = new TransactionService();
