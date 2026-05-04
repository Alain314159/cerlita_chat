import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { AppState, type AppStateStatus } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { pushNotificationService } from '@/services/pushNotifications';
import { SplashScreen } from '@/components/ui/SplashScreen';

interface AuthContextType {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const segments = useSegments();
  const router = useRouter();
  const { user, isAuthenticated, loading, initialize, signOut: storeSignOut, signIn: storeSignIn, signUp: storeSignUp } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  // Inicializar autenticación
  useEffect(() => {
    const initAuth = async () => {
      try {
        await initialize();
      } catch (error) {
        console.error('Failed to initialize auth:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initAuth();
  }, []);

  // Inicializar notificaciones cuando está autenticado
  useEffect(() => {
    if (Platform.OS !== 'web' && isAuthenticated && !loading && user?.id) {
      pushNotificationService.initialize(user.id).catch(console.error);
    }
    
    return () => {
      if (Platform.OS !== 'web') {
        pushNotificationService.cleanup();
      }
    };
  }, [isAuthenticated, loading, user?.id]);

  // Manejar cambios de estado de la app (background/foreground)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      console.log('App state changed:', nextAppState);
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => { subscription.remove(); };
  }, [user]);

  // Proteger rutas
  useEffect(() => {
    if (isInitializing || loading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(chat)');
    }
  }, [isAuthenticated, loading, isInitializing, segments]);

  const signOut = useCallback(async () => {
    try {
      await storeSignOut();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Failed to sign out:', error);
    }
  }, [storeSignOut, router]);

  if (isInitializing || loading) {
    return <SplashScreen />;
  }

  return (
    <AuthContext.Provider value={{ user, isLoading: loading, isAuthenticated, signIn: storeSignIn, signUp: storeSignUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};
