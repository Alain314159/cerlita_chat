import { useAuthStore } from '@/store/authStore';
import type { AvatarOption } from '@/types';

// Re-exportar desde el provider para compatibilidad
export { useAuth } from '@/providers/AuthProvider';

// Hook para lógica adicional de autenticación
export function useAuthLogic() {
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
    updateAvatar,
    setError,
  } = useAuthStore();

  return {
    user,
    isAuthenticated,
    loading,
    error,
    initialize,
    signIn,
    signUp,
    signOut,
    updateProfile,
    updateAvatar: (avatar: AvatarOption) => updateAvatar(avatar),
    setError,
  };
}
