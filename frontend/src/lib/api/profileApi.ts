import apiClient from './apiClient';

export interface BaseProfile {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface Experience {
  id: string;
  company_name: string;
  title: string;
  description?: string;
  start_date: string;
  end_date?: string;
  is_current: boolean;
}

export interface EducationEntry {
  id: string;
  institution: string;
  degree?: string;
  field_of_study?: string;
  start_year?: number;
  end_year?: number;
}

export interface LanguageEntry {
  id: string;
  name: string;
  proficiency?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  role?: string;
  url?: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
}

export interface Skill {
  id: string;
  name: string;
}

export interface SeekerProfile extends BaseProfile {
  full_name: string;
  headline?: string;
  location?: string;
  about?: string;
  profile_visibility: string;
  profile_photo_url?: string;
  resume_url?: string;
  profile_views_count: number;
  resume_views_count: number;
  experiences: Experience[];
  education_entries: EducationEntry[];
  certifications: any[];
  languages: LanguageEntry[];
  skills: Skill[];
  projects: Project[];
  parsed_resume_data?: any;
}

export interface EmployerProfile extends BaseProfile {
  company_name: string;
  description?: string;
  website?: string;
  industry?: string;
  company_size?: string;
  location?: string;
  logo_url?: string;
  cover_image_url?: string;
  headquarters?: string;
  employees_count?: number;
  founded_year?: number;
}

export interface TimeBucket {
  period: string; // ISO date
  count: number;
}

export interface EmployerStats {
  total_jobs: number;
  total_hires: number;
  jobs_per_month: TimeBucket[];
  hires_per_month: TimeBucket[];
}

export const profileApi = {
  getSeekerMe: async (): Promise<SeekerProfile> => {
    const response = await apiClient.get<SeekerProfile>('/profiles/seeker/me');
    return response.data;
  },

  createSeekerMe: async (data: Partial<SeekerProfile>): Promise<SeekerProfile> => {
    const response = await apiClient.post<SeekerProfile>('/profiles/seeker', data);
    return response.data;
  },

  updateSeekerMe: async (data: Partial<SeekerProfile>): Promise<SeekerProfile> => {
    const response = await apiClient.patch<SeekerProfile>('/profiles/seeker', data);
    return response.data;
  },

  getPublicSeekerProfile: async (profileId: string): Promise<SeekerProfile> => {
    const response = await apiClient.get<SeekerProfile>(`/profiles/seeker/${profileId}`);
    return response.data;
  },

  // Experience CRUD
  addExperience: async (data: Omit<Experience, 'id'>): Promise<SeekerProfile> => {
    const response = await apiClient.post<SeekerProfile>('/profiles/seeker/experiences', data);
    return response.data;
  },

  updateExperience: async (id: string, data: Partial<Omit<Experience, 'id'>>): Promise<SeekerProfile> => {
    const response = await apiClient.patch<SeekerProfile>(`/profiles/seeker/experience/${id}`, data);
    return response.data;
  },

  deleteExperience: async (experienceId: string): Promise<SeekerProfile> => {
    const response = await apiClient.delete<SeekerProfile>(`/profiles/seeker/experiences/${experienceId}`);
    return response.data;
  },

  // Education CRUD
  addEducation: async (data: Omit<EducationEntry, 'id'>): Promise<SeekerProfile> => {
    const response = await apiClient.post<SeekerProfile>('/profiles/seeker/education', data);
    return response.data;
  },

  updateEducation: async (id: string, data: Partial<Omit<EducationEntry, 'id'>>): Promise<SeekerProfile> => {
    const response = await apiClient.patch<SeekerProfile>(`/profiles/seeker/education/${id}`, data);
    return response.data;
  },

  deleteEducation: async (educationId: string): Promise<SeekerProfile> => {
    const response = await apiClient.delete<SeekerProfile>(`/profiles/seeker/education/${educationId}`);
    return response.data;
  },

  // Language CRUD
  addLanguage: async (data: Omit<LanguageEntry, 'id'>): Promise<SeekerProfile> => {
    const response = await apiClient.post<SeekerProfile>('/profiles/seeker/languages', data);
    return response.data;
  },

  updateLanguage: async (id: string, data: Partial<Omit<LanguageEntry, 'id'>>): Promise<SeekerProfile> => {
    const response = await apiClient.patch<SeekerProfile>(`/profiles/seeker/language/${id}`, data);
    return response.data;
  },

  deleteLanguage: async (languageId: string): Promise<SeekerProfile> => {
    const response = await apiClient.delete<SeekerProfile>(`/profiles/seeker/languages/${languageId}`);
    return response.data;
  },

  // Project CRUD
  addProject: async (data: Omit<Project, 'id'>): Promise<SeekerProfile> => {
    const response = await apiClient.post<SeekerProfile>('/profiles/seeker/project', data);
    return response.data;
  },

  updateProject: async (id: string, data: Partial<Omit<Project, 'id'>>): Promise<SeekerProfile> => {
    const response = await apiClient.patch<SeekerProfile>(`/profiles/seeker/project/${id}`, data);
    return response.data;
  },

  deleteProject: async (projectId: string): Promise<SeekerProfile> => {
    const response = await apiClient.delete<SeekerProfile>(`/profiles/seeker/project/${projectId}`);
    return response.data;
  },

  // Employer
  getEmployerMe: async (): Promise<EmployerProfile> => {
    const response = await apiClient.get<EmployerProfile>('/profiles/employer/me');
    return response.data;
  },

  getPublicEmployer: async (userId: string): Promise<EmployerProfile> => {
    const response = await apiClient.get<EmployerProfile>(`/profiles/employer/${userId}`);
    return response.data;
  },

  getPublicEmployerStats: async (userId: string): Promise<EmployerStats> => {
    const response = await apiClient.get<EmployerStats>(`/profiles/employer/${userId}/stats`);
    return response.data;
  },

  createEmployerMe: async (data: Partial<EmployerProfile>): Promise<EmployerProfile> => {
    const response = await apiClient.post<EmployerProfile>('/profiles/employer', data);
    return response.data;
  },

  updateEmployerMe: async (data: Partial<EmployerProfile>): Promise<EmployerProfile> => {
    const response = await apiClient.patch<EmployerProfile>('/profiles/employer', data);
    return response.data;
  },

  uploadResume: async ({ file, prefill_profile = false }: { file: File, prefill_profile?: boolean }): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('prefill_profile', String(prefill_profile));
    const response = await apiClient.post<SeekerProfile>('/profiles/seeker/resume', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return { url: response.data.resume_url || '' };
  },

  syncSkills: async (skills: string[]): Promise<SeekerProfile> => {
    const response = await apiClient.put<SeekerProfile>('/profiles/seeker/skills', skills);
    return response.data;
  },

  uploadPhoto: async (file: File): Promise<SeekerProfile> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<SeekerProfile>('/profiles/seeker/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};
