import apiClient from './apiClient';

export interface AIJobRecommendation {
  job_id: string;
  job_title: string;
  company_name: string;
  match_score: number;
  strengths: string[];
  gaps: string[];
  summary: string;
}

export interface AIRecommendationsResponse {
  recommendations: AIJobRecommendation[];
}

export interface ResumeMatchResult {
  match_score: number;
  strengths: string[];
  gaps: string[];
  overall_assessment: string;
}

export const aiApi = {
  getJobRecommendations: async (): Promise<AIRecommendationsResponse> => {
    const response = await apiClient.get<AIRecommendationsResponse>('/ai/job-recommendations');
    return response.data;
  },

  scoreApplicationResume: async (jobId: string, resumeFile: File): Promise<ResumeMatchResult> => {
    const formData = new FormData();
    formData.append('job_id', jobId);
    formData.append('resume', resumeFile);
    const response = await apiClient.post<ResumeMatchResult>('/ai/application-score', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  scoreResumeMatch: async (applicationId: string): Promise<ResumeMatchResult> => {
    const response = await apiClient.post<ResumeMatchResult>(`/ai/resume-match/${applicationId}`);
    return response.data;
  }
};
