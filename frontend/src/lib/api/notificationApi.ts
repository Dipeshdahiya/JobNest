import apiClient from './apiClient';

export interface Notification {
  id: string;
  user_id: string;
  type: 'connection_request' | 'message' | 'post_interaction' | 'application_update' | 'job_recommendation';
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

export const notificationApi = {
  list: async (skip = 0, limit = 20): Promise<Notification[]> => {
    const response = await apiClient.get<Notification[]>('/notifications', { params: { skip, limit } });
    return response.data;
  },

  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await apiClient.patch<Notification>(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllRead: async (): Promise<{ marked_read: number }> => {
    const response = await apiClient.patch<{ marked_read: number }>('/notifications/read-all');
    return response.data;
  },
};
