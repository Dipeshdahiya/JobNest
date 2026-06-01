import apiClient from "./apiClient";
import { Post } from "./socialApi";

export interface SearchPerson {
  id: string;
  email: string;
  full_name: string | null;
}

export interface SearchCompany {
  id: string;
  company_name: string;
  industry: string | null;
  user_id: string;
}

export const searchApi = {
  searchPeople: async (q: string, skip = 0, limit = 20): Promise<SearchPerson[]> => {
    const res = await apiClient.get('/search/people', { params: { q, skip, limit } });
    return res.data;
  },
  searchCompanies: async (q: string, skip = 0, limit = 20): Promise<SearchCompany[]> => {
    const res = await apiClient.get('/search/companies', { params: { q, skip, limit } });
    return res.data;
  },
  searchPosts: async (q: string, skip = 0, limit = 20): Promise<Post[]> => {
    const res = await apiClient.get('/search/posts', { params: { q, skip, limit } });
    return res.data;
  }
};
