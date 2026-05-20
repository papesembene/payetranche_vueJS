import { http } from './http.js';

class AnalyticsService {
  async getDashboardMetrics() {
    try {
      const response = await http.get('/analytics/dashboard');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des statistiques');
    }
  }
}

export const analyticsService = new AnalyticsService();
