import apiClient from './apiClient';

export interface User {
  id: string;
  email: string;
  role: 'seeker' | 'employer' | 'admin';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export const userApi = {
  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/users/me');
    return response.data;
  },

  updateMe: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.patch<User>('/users/me', data);
    return response.data;
  },

  getUser: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },
};
