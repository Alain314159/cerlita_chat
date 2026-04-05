import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { notificationService } from '@/services/supabase/notification.service';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    loading,
    error,
    initialize,
    signIn,
    signUp,
    signOut,
    updateProfile,
    setError,
  } = useAuthStore();

  // Initialize on mount
  useEffect(() => {
    initialize();

    // Cleanup
    return () => {
      // Set offline on unmount
      if (user) {
        // Note: This might not execute if app is killed
      }
    };
  }, []);

  // Initialize notifications when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      notificationService.initialize().catch(console.error);
    }
  }, [isAuthenticated]);

  return {
    user,
    isAuthenticated,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    setError,
  };
}
