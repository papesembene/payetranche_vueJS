import { http } from './http.js';
import { getUserFriendlyError } from '../utils/userFriendlyError.js';

class AnalyticsService {
  async getDashboardMetrics() {
    try {
      const response = await http.get('/analytics/dashboard');
      return response.data.data;
    } catch (error) {
      throw new Error(getUserFriendlyError(error, 'load'));
    }
  }
}

export const analyticsService = new AnalyticsService();
