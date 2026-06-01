import apiClient from './apiClient';

export interface Application {
  id: string;
  job_id: string;
  seeker_id: string;
  status: 'applied' | 'reviewing' | 'interviewing' | 'offer' | 'rejected' | 'withdrawn';
  cover_letter?: string;
  resume_url?: string;
  ai_match_score?: number;
  ai_review_text?: string;
  created_at: string;
  updated_at: string;
}

export const applicationApi = {
  apply: async (data: { job_id: string; cover_letter?: string }): Promise<Application> => {
    const response = await apiClient.post<Application>('/applications', data);
    return response.data;
  },

  getMyApplications: async (): Promise<Application[]> => {
    const response = await apiClient.get<Application[]>('/applications/me');
    return response.data;
  },

  getJobApplicants: async (jobId: string): Promise<Application[]> => {
    const response = await apiClient.get<Application[]>(`/applications/job/${jobId}`);
    return response.data;
  },

  getApplication: async (id: string): Promise<Application> => {
    const response = await apiClient.get<Application>(`/applications/${id}`);
    return response.data;
  },

  updateStatus: async (id: string, status: string): Promise<Application> => {
    const response = await apiClient.patch<Application>(`/applications/${id}`, { status });
    return response.data;
  },
};
