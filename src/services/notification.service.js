import { http } from './http.js';

const normalizeAlert = (alert) => ({
  ...alert,
  status: alert.status?.toLowerCase(),
  type: alert.type,
  dueDate: alert.metadata?.dueDate,
  amount: alert.metadata?.remainingAmount || 0,
  clientName: alert.client?.name || 'Client inconnu'
});

const normalizeReminder = (reminder) => ({
  ...reminder,
  amount: Number(reminder.amount || 0),
  overdueDays: Number(reminder.overdueDays || 0),
  reminderCount: Number(reminder.reminderCount || 0),
  remindedToday: Boolean(reminder.remindedToday),
  clientPhone: reminder.clientPhone || ''
});

class NotificationService {
  async scanOverdue() {
    try {
      const response = await http.post('/notifications/scan-overdue');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du scan des retards');
    }
  }

  async getAlerts(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status.toUpperCase());
      if (filters.type) params.set('type', filters.type);
      if (filters.clientId) params.set('clientId', filters.clientId);

      const response = await http.get(`/notifications/alerts?${params.toString()}`);
      return response.data.data.map(normalizeAlert);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des alertes');
    }
  }

  async markAsRead(alertId) {
    const response = await http.patch(`/notifications/alerts/${alertId}/read`);
    return normalizeAlert(response.data.data);
  }

  async getTodayReminders() {
    try {
      const response = await http.get('/notifications/reminders/today');
      return (response.data.data || []).map(normalizeReminder);
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors du chargement des relances');
    }
  }

  async markWhatsAppReminder(type, id) {
    const response = await http.post(`/notifications/reminders/${type}/${id}/whatsapp`);
    return response.data.data;
  }
}

export const notificationService = new NotificationService();
