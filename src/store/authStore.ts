import { create } from 'zustand';
import type { User, AuthState, AvatarOption } from '@/types';
import { authService } from '@/services/supabase/auth.service';
import { pushNotificationService } from '@/services/pushNotifications';
import { SignInUseCase } from '@/use-cases/auth/SignIn';
import { SignUpUseCase } from '@/use-cases/auth/SignUp';
import { SignOutUseCase } from '@/use-cases/auth/SignOut';
import { InitializeAuthUseCase } from '@/use-cases/auth/InitializeAuth';

export interface AuthStore extends AuthState {
  selectedAvatar: AvatarOption | null;
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
  updateAvatar: (photoURL: string) => Promise<void>;
  setAvatar: (avatar: AvatarOption) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,
  selectedAvatar: null,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setError: (error) => set({ error }),
  setAvatar: (avatar) => set({ selectedAvatar: avatar }),

  // Initialize auth state
  initialize: async () => {
    await InitializeAuthUseCase(
      {
        getSession: authService.getSession,
        getUserProfile: authService.getUserProfile,
        updatePresence: authService.updatePresence,
        onAuthStateChange: authService.onAuthStateChange,
      },
      (user) => set({ user, isAuthenticated: !!user, loading: false })
    );
  },

  // Sign in
  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });
      const user = await SignInUseCase(authService, email, password);
      set({ user, isAuthenticated: true, loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      set({ loading: false, error: message });
      throw error;
    }
  },

  // Sign up
  signUp: async (email: string, password: string, displayName: string) => {
    try {
      set({ loading: true, error: null });
      const user = await SignUpUseCase(authService, email, password, displayName);
      if (user) {
        set({ user, isAuthenticated: true, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sign up';
      set({ loading: false, error: message });
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      set({ loading: true });
      await SignOutUseCase({
        signOut: authService.signOut,
        cleanupNotifications: pushNotificationService.cleanup
      });
      set({ user: null, isAuthenticated: false, loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sign out';
      set({ loading: false, error: message });
      throw error;
    }
  },

  // Update profile
  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return;
    try {
      set({ loading: true });
      await authService.updateProfile(user.id, updates);
      set({
        user: { ...user, ...updates },
        loading: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      set({ loading: false, error: message });
      throw error;
    }
  },

  updateAvatar: async (photoURL: string) => {
    const { user } = get();
    if (!user) return;
    try {
      await authService.updateProfile(user.id, { photoURL });
      set({ user: { ...user, photoURL } });
    } catch (error) {
      console.error('Failed to update avatar:', error);
    }
  },
}));
