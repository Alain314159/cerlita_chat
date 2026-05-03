import { create } from 'zustand';
import type { User, AuthState, AvatarOption } from '@/types';
import { authService } from '@/services/supabase/auth.service';
import { supabase } from '@/services/supabase/config';
import { pushNotificationService } from '@/services/pushNotifications';

interface AuthStore extends AuthState {
  // Actions
  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { displayName?: string; photoURL?: string }) => Promise<void>;
  updateAvatar: (avatar: AvatarOption) => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isAuthenticated: false,
  loading: true,
  error: null,

  // Initialize auth state
  initialize: async () => {
    try {
      set({ loading: true, error: null });

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const userProfile = await authService.getUserProfile(session.user.id);

        // Set online status
        await authService.updatePresence(true, session.user.id);

        set({
          user: userProfile,
          isAuthenticated: true,
          loading: false,
        });
      } else {
        set({ loading: false });
      }

      // Subscribe to auth changes
      authService.onAuthStateChange(async (event: any, session: any) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const userProfile = await authService.getUserProfile(session.user.id);
          await authService.updatePresence(true, session.user.id);

          set({
            user: userProfile,
            isAuthenticated: true,
            loading: false,
            error: null,
          });
        } else if (event === 'SIGNED_OUT') {
          set({
            user: null,
            isAuthenticated: false,
            loading: false,
          });
        }
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to initialize';
      set({
        loading: false,
        error: message,
      });
    }
  },

  // Sign in
  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });

      const user = await authService.signIn(email, password);
      
      set({
        user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sign in';
      set({
        loading: false,
        error: message,
      });
      throw error;
    }
  },

  // Sign up
  signUp: async (email: string, password: string, displayName: string) => {
    try {
      set({ loading: true, error: null });

      const user = await authService.signUp(email, password, displayName);
      
      set({
        user,
        isAuthenticated: true,
        loading: false,
        error: null,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sign up';
      set({
        loading: false,
        error: message,
      });
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    try {
      set({ loading: true });
      await authService.signOut();
      
      // Cleanup notifications
      pushNotificationService.cleanup();
      
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to sign out';
      set({ 
        loading: false,
        error: message 
      });
      throw error;
    }
  },

  // Update profile
  updateProfile: async (updates: { displayName?: string; photoURL?: string }) => {
    try {
      const { user } = get();
      if (!user) throw new Error('Not authenticated');

      set({ loading: true });

      await authService.updateProfile(user.id, updates);

      // Refresh user data
      const updatedUser = await authService.getUserProfile(user.id);

      set({
        user: updatedUser,
        loading: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      set({
        loading: false,
        error: message,
      });
      throw error;
    }
  },

  // Update avatar
  updateAvatar: async (avatar: AvatarOption) => {
    try {
      const { user } = get();
      if (!user) throw new Error('Not authenticated');

      set({ loading: true });

      // Update user profile with avatar option
      const updatedUser = {
        ...user,
        avatar,
        photoURL: (avatar.type === 'custom' ? avatar.uri : null) as string | null,
      };

      await authService.updateProfile(user.id, {
        displayName: updatedUser.displayName,
        photoURL: updatedUser.photoURL ?? undefined,
      });

      set({
        user: updatedUser,
        loading: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update avatar';
      set({
        loading: false,
        error: message,
      });
      throw error;
    }
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));
