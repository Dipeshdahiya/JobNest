import apiClient from './apiClient';

export interface Hashtag {
  id: string;
  name: string;
  usage_count: number;
}

export interface Post {
  id: string;
  user_id: string;
  author_name?: string; // added manually via mapping later if needed
  content: string;
  media_url?: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  hashtags: Hashtag[];
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  author_name?: string;
  content: string;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
}

export interface ReportRequest {
  entity_type: 'post' | 'comment' | 'user' | 'job' | 'application';
  entity_id: string;
  reason: string;
}

export const socialApi = {
  getFeed: async (params?: Record<string, any>): Promise<Post[]> => {
    const response = await apiClient.get<Post[]>('/social/feed', { params });
    return response.data;
  },

  createPost: async (data: Partial<Post> & { hashtag_names?: string[] }): Promise<Post> => {
    const response = await apiClient.post<Post>('/social/posts', data);
    return response.data;
  },

  getPost: async (id: string): Promise<Post> => {
    const response = await apiClient.get<Post>(`/social/posts/${id}`);
    return response.data;
  },

  updatePost: async (id: string, data: Partial<Post>): Promise<Post> => {
    const response = await apiClient.patch<Post>(`/social/posts/${id}`, data);
    return response.data;
  },

  deletePost: async (id: string): Promise<void> => {
    await apiClient.delete(`/social/posts/${id}`);
  },

  likePost: async (id: string): Promise<void> => {
    await apiClient.post(`/social/posts/${id}/like`);
  },

  unlikePost: async (id: string): Promise<void> => {
    await apiClient.delete(`/social/posts/${id}/like`);
  },

  getComments: async (postId: string): Promise<Comment[]> => {
    const response = await apiClient.get<Comment[]>(`/social/posts/${postId}/comments`);
    return response.data;
  },

  addComment: async (postId: string, data: { content: string, parent_comment_id?: string }): Promise<Comment> => {
    const response = await apiClient.post<Comment>(`/social/posts/${postId}/comments`, data);
    return response.data;
  },

  getTrendingHashtags: async (): Promise<Hashtag[]> => {
    const response = await apiClient.get<Hashtag[]>('/social/trending');
    return response.data;
  },

  getPostsByHashtag: async (name: string, skip = 0, limit = 20): Promise<Post[]> => {
    const response = await apiClient.get<Post[]>(`/social/hashtag/${name}`, { params: { skip, limit } });
    return response.data;
  },

  report: async (data: ReportRequest): Promise<void> => {
    await apiClient.post('/admin/reports', data);
  },
};
