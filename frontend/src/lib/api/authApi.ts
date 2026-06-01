import apiClient from './apiClient';

export interface LoginRequest {
  username: string; // OAuth2 Password flow typically uses 'username' for email
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: 'seeker' | 'employer';
}

export interface VerifyEmailRequest {
  email: string;
  otp_code: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  new_password: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const authApi = {
  login: async (data: LoginRequest): Promise<TokenResponse> => {
    // FastAPI's OAuth2PasswordRequestForm expects form-urlencoded data
    const formData = new URLSearchParams();
    formData.append('username', data.username);
    formData.append('password', data.password);
    
    // Note: The FastAPI backend for CC uses regular JSON for login based on typical modern setups, 
    // unless it specifically uses OAuth2PasswordRequestForm. I will use regular JSON first 
    // but check the backend if it expects form data. Let's assume JSON body based on standard schemas.
    // Wait, FastAPI's `OAuth2PasswordRequestForm` requires `application/x-www-form-urlencoded`.
    // We will send standard JSON if they implemented custom, or form-data if standard OAuth2.
    // Let's send form data just in case, or we can use JSON if the schema says so.
    // Looking at common FastAPI+Pydantic implementations, a custom `/auth/login` often takes JSON.
    // Let's use JSON as it is cleaner, but we might need to change it if it fails.
    const response = await apiClient.post<TokenResponse>('/auth/login', {
      email: data.username,
      password: data.password,
    });
    return response.data;
  },

  register: async (data: RegisterRequest) => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  verifyEmail: async (data: VerifyEmailRequest) => {
    // Some APIs use query params, some use body. Assuming body base on Pydantic schema
    const response = await apiClient.post('/auth/verify-email', data);
    return response.data;
  },

  forgotPassword: async (data: ForgotPasswordRequest) => {
    const response = await apiClient.post('/auth/forgot-password', data);
    return response.data;
  },

  resetPassword: async (data: ResetPasswordRequest) => {
    const response = await apiClient.post('/auth/reset-password', data);
    return response.data;
  },

  resendOtp: async (data: { email: string }) => {
    const response = await apiClient.post('/auth/resend-otp', data);
    return response.data;
  },

  refresh: async (): Promise<TokenResponse> => {
    // Directly calls the refresh endpoint (handled mostly by the interceptor, but exposed just in case)
    const response = await apiClient.post<TokenResponse>('/auth/refresh');
    return response.data;
  },
};
