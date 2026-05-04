import api from './api.js';

const notificationApiService = {
  getMyNotifications: async (limit = 30) => {
    const response = await api.get(`/notifications?limit=${limit}`);
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.patch('/notifications/read-all');
    return response.data;
  }
};

export default notificationApiService;
