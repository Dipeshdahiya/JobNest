import { create } from 'zustand';

interface AppState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  currentRole: 'seeker' | 'employer' | 'admin';
  setCurrentRole: (role: 'seeker' | 'employer' | 'admin') => void;
}

export const useStore = create<AppState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  currentRole: 'seeker',
  setCurrentRole: (role) => set({ currentRole: role }),
}));
