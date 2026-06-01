import apiClient from './apiClient';

export interface Job {
  id: string;
  employer_profile_id: string;
  title: string;
  company_name?: string;
  employer_user_id?: string;
  location?: string;
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship';
  description: string;
  requirements?: string;
  what_to_expect?: string;
  additional_benefits?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency?: string;
  is_remote: boolean;
  experience_level: 'junior' | 'mid' | 'senior';
  status: 'open' | 'closed' | 'archived';
  views_count: number;
  applications_count: number;
  openings?: number;
  created_at: string;
  updated_at: string;
}

export const jobApi = {
  getJobs: async (params?: Record<string, any>): Promise<Job[]> => {
    const response = await apiClient.get<Job[]>('/jobs', { params });
    return response.data;
  },

  getMyJobs: async (params?: Record<string, any>): Promise<Job[]> => {
    const response = await apiClient.get<Job[]>('/jobs/employer/me', { params });
    return response.data;
  },

  getJob: async (id: string): Promise<Job> => {
    const response = await apiClient.get<Job>(`/jobs/${id}`);
    return response.data;
  },

  createJob: async (data: Partial<Job>): Promise<Job> => {
    const response = await apiClient.post<Job>('/jobs', data);
    return response.data;
  },

  updateJob: async (id: string, data: Partial<Job>): Promise<Job> => {
    const response = await apiClient.patch<Job>(`/jobs/${id}`, data);
    return response.data;
  },

  deleteJob: async (id: string): Promise<void> => {
    await apiClient.delete(`/jobs/${id}`);
  },

  saveJob: async (id: string): Promise<void> => {
    await apiClient.post(`/jobs/${id}/save`);
  },

  unsaveJob: async (id: string): Promise<void> => {
    await apiClient.delete(`/jobs/${id}/unsave`); // If unsave is via delete
  },

  getSavedJobs: async (): Promise<Job[]> => {
    const response = await apiClient.get<Job[]>('/jobs/saved');
    return response.data;
  },

  getRecommendations: async (): Promise<Job[]> => {
    const response = await apiClient.get<Job[]>('/jobs/recommendations');
    return response.data;
  },
};
