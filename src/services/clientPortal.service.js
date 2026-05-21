import { http } from './http.js';

class ClientPortalService {
  async getSellerPortalLink(creditId) {
    const response = await http.get(`/credits/${creditId}/client-portal`);
    return response.data.data;
  }

  async getPortal(token) {
    const response = await http.get(`/client-portal/${token}`);
    return response.data.data;
  }
}

export const clientPortalService = new ClientPortalService();
