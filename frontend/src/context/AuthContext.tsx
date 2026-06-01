import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { userApi, User } from '../lib/api/userApi';
import { authApi, LoginRequest, RegisterRequest } from '../lib/api/authApi';
import { setAccessToken } from '../lib/api/apiClient';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<User>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Sync token to API client whenever it changes
  const applyToken = (token: string | null) => {
    setTokenState(token);
    setAccessToken(token);
    // Persist to local storage as fallback for reloads
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
  };

  const loadUser = async () => {
    try {
      const userData = await userApi.getMe();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load user profile', error);
      applyToken(null);
      setUser(null);
    }
  };

  const refreshToken = async () => {
    try {
      const { access_token } = await authApi.refresh();
      applyToken(access_token);
      await loadUser();
    } catch (error) {
      applyToken(null);
      setUser(null);
    }
  };

  // Initial load
  useEffect(() => {
    const initAuth = async () => {
      // First check local storage for a token
      const savedToken = localStorage.getItem('accessToken');
      
      if (savedToken) {
        applyToken(savedToken);
        // Verify it by fetching user
        try {
          await loadUser();
        } catch (e) {
          // If token is invalid, try to refresh using httpOnly cookie
          await refreshToken();
        }
      } else {
        // Even if no saved token, there might be a refresh cookie. Let's try it.
        await refreshToken();
      }
      setIsLoading(false);
    };

    initAuth();

    // Listen to explicit logout events from API client interceptors
    const handleLogoutEvent = () => {
      logout();
    };
    
    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => window.removeEventListener('auth:logout', handleLogoutEvent);
  }, []);

  const login = async (data: LoginRequest) => {
    const { access_token } = await authApi.login(data);
    applyToken(access_token);
    // Load the user immediately so callers (e.g. login page) can route based on role
    const userData = await userApi.getMe();
    setUser(userData);
    return userData;
  };

  const register = async (data: RegisterRequest) => {
    await authApi.register(data);
    // After registration, they usually need to verify email, 
    // so we don't automatically log them in or attempt to get user unless the backend does
  };

  const logout = () => {
    applyToken(null);
    setUser(null);
    // The backend might need a logout endpoint call to clear the httpOnly cookie
    // Assuming a standard setup where clearing local access token forces fresh state,
    // although calling an API to clear the cookie is best.
    // authApi.logout(); // If implemented on backend
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...data });
    }
  };

  const value = {
    user,
    accessToken,
    isLoading,
    login,
    register,
    logout,
    refreshToken,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
