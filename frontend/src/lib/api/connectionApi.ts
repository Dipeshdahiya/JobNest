import apiClient from './apiClient';

export interface Connection {
  id: string;
  requester_id: string;
  receiver_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export const connectionApi = {
  sendRequest: async (receiver_id: string): Promise<Connection> => {
    const response = await apiClient.post<Connection>('/connections/request', { receiver_id });
    return response.data;
  },

  accept: async (connectionId: string): Promise<Connection> => {
    const response = await apiClient.patch<Connection>(`/connections/${connectionId}/accept`);
    return response.data;
  },

  reject: async (connectionId: string): Promise<Connection> => {
    const response = await apiClient.patch<Connection>(`/connections/${connectionId}/reject`);
    return response.data;
  },

  listConnections: async (): Promise<Connection[]> => {
    const response = await apiClient.get<Connection[]>('/connections');
    return response.data;
  },

  listPending: async (): Promise<Connection[]> => {
    const response = await apiClient.get<Connection[]>('/connections/pending');
    return response.data;
  },
};
