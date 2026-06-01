import apiClient from './apiClient';

export interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface Conversation {
  partner_id: string;
  partner_name?: string; // we'll map or leave
  last_message: Message;
  unread_count: number;
}

export const messagingApi = {
  getConversations: async (): Promise<Conversation[]> => {
    const response = await apiClient.get<Conversation[]>('/messaging/conversations');
    return response.data;
  },

  getConversation: async (userId: string): Promise<Message[]> => {
    const response = await apiClient.get<Message[]>(`/messaging/conversation/${userId}`);
    return response.data;
  },

  sendMessage: async (data: { receiver_id: string; content: string }): Promise<Message> => {
    const response = await apiClient.post<Message>('/messaging', data);
    return response.data;
  },

  markAsRead: async (messageId: string): Promise<void> => {
    await apiClient.patch(`/messaging/${messageId}/read`);
  },
};
