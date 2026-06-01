import apiClient from './apiClient';

export interface AdminStats {
  total_users: number;
  total_seekers: number;
  total_employers: number;
  total_jobs: number;
  total_posts: number;
  total_applications: number;
}

// Reuse User and Job interfaces from their respective files if needed, 
// using generic records here for simplicity until full typing is needed in components
export const adminApi = {
  getStats: async (): Promise<AdminStats> => {
    const response = await apiClient.get<AdminStats>('/admin/stats');
    return response.data;
  },

  getUsers: async (params?: Record<string, any>) => {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  },

  deactivateUser: async (id: string): Promise<void> => {
    await apiClient.patch(`/admin/users/${id}/deactivate`);
  },

  getJobs: async (params?: Record<string, any>) => {
    const response = await apiClient.get('/admin/jobs', { params });
    return response.data;
  },

  deactivateJob: async (id: string): Promise<void> => {
    await apiClient.patch(`/admin/jobs/${id}/deactivate`);
  },

  deletePost: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/posts/${id}`);
  },

  getReports: async (params?: Record<string, any>) => {
    const response = await apiClient.get('/admin/reports', { params });
    return response.data;
  },

  reviewReport: async (id: string): Promise<void> => {
    await apiClient.patch(`/admin/reports/${id}/review`);
  },

  dismissReport: async (id: string): Promise<void> => {
    await apiClient.patch(`/admin/reports/${id}/dismiss`);
  },
};
