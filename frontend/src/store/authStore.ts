import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser } from '../types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  orgVerified: boolean;
  isAuthenticated: boolean;

  setTokens: (access: string, refresh: string) => void;
  setUser: (user: AuthUser) => void;
  setOrgVerified: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      orgVerified: false,
      isAuthenticated: false,

      setTokens: (access, refresh) =>
        set({ accessToken: access, refreshToken: refresh, isAuthenticated: true }),

      setUser: (user) => set({ user }),

      setOrgVerified: (v) => set({ orgVerified: v }),

      logout: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          orgVerified: false,
          isAuthenticated: false,
        }),
    }),
    {
      name: 'ojakazi-auth',
      partialize: (s) => ({
        accessToken: s.accessToken,
        refreshToken: s.refreshToken,
        user: s.user,
        orgVerified: s.orgVerified,
        isAuthenticated: s.isAuthenticated,
      }),
    }
  )
);
