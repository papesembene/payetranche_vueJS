import { http } from './http.js';

const backendStatusToFrontend = (status) => {
  if (status === 'BON') return 'active';
  if (status === 'RISQUE') return 'risk';
  if (status === 'MAUVAIS') return 'bad';
  return 'active';
};

const frontendStatusToBackend = (status) => {
  if (status === 'risk') return 'RISQUE';
  if (status === 'bad') return 'MAUVAIS';
  if (['BON', 'RISQUE', 'MAUVAIS'].includes(status)) return status;
  return 'BON';
};

const normalizeClient = (client) => ({
  ...client,
  status: backendStatusToFrontend(client.status),
  backendStatus: client.status,
  total: client.totalDebt || 0,
  paid: Math.max((client.totalDebt || 0) - (client.totalDebt || 0), 0),
  acompte: client.acompte || 0
});

class ClientService {
  async getClients(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set('search', filters.search);
      if (filters.status && ['BON', 'RISQUE', 'MAUVAIS'].includes(filters.status)) {
        params.set('status', filters.status);
      }

      const response = await http.get(`/clients?${params.toString()}`);
      let clients = response.data.data.map(normalizeClient);

      if (filters.status && !['BON', 'RISQUE', 'MAUVAIS'].includes(filters.status)) {
        clients = clients.filter((client) => client.status === filters.status);
      }

      return clients;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des clients');
    }
  }

  async getClient(clientId) {
    try {
      const response = await http.get(`/clients/${clientId}`);
      return normalizeClient(response.data.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement du client');
    }
  }

  async createClient(clientData) {
    try {
      const initialDebt = Number(clientData.totalDebt || 0);
      const initialPaid = Number(clientData.acompte || 0);

      const response = await http.post('/clients', {
        name: clientData.name,
        phone: clientData.phone,
        address: clientData.address,
        notes: clientData.notes,
        totalDebt: 0,
        status: frontendStatusToBackend(clientData.status)
      });

      const client = response.data.data;

      if (initialDebt > 0) {
        const creditResponse = await http.post('/credits', {
          clientId: client.id,
          amount: initialDebt,
          paidAmount: 0,
          description: clientData.description || 'Dette initiale',
          dueDate: clientData.dueDate
            ? new Date(clientData.dueDate).toISOString()
            : undefined
        });

        if (initialPaid > 0) {
          await http.post('/payments', {
            clientId: client.id,
            creditId: creditResponse.data.data.id,
            amount: Math.min(initialPaid, initialDebt),
            method: 'CASH',
            status: 'COMPLETED',
            reference: 'Acompte'
          });
        }
      }

      return this.getClient(client.id);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la création du client');
    }
  }

  async updateClient(clientId, clientData) {
    try {
      const payload = {};
      if (clientData.name !== undefined) payload.name = clientData.name;
      if (clientData.phone !== undefined) payload.phone = clientData.phone;
      if (clientData.address !== undefined) payload.address = clientData.address;
      if (clientData.notes !== undefined) payload.notes = clientData.notes;
      if (clientData.totalDebt !== undefined) payload.totalDebt = Number(clientData.totalDebt || 0);
      if (clientData.status !== undefined) payload.status = frontendStatusToBackend(clientData.status);

      const response = await http.patch(`/clients/${clientId}`, payload);
      return normalizeClient(response.data.data);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la mise à jour du client');
    }
  }

  async deleteClient(clientId) {
    try {
      await http.delete(`/clients/${clientId}`);
      return { success: true };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de la suppression du client');
    }
  }

  async searchClients(query) {
    return this.getClients({ search: query });
  }

  async getClientStats() {
    const clients = await this.getClients();
    const active = clients.filter((client) => client.status === 'active').length;
    const totalDebt = clients.reduce((sum, client) => sum + (client.totalDebt || 0), 0);

    return {
      total: clients.length,
      active,
      inactive: clients.length - active,
      totalDebt,
      averageDebt: clients.length ? Math.round(totalDebt / clients.length) : 0
    };
  }
}

export const clientService = new ClientService();
