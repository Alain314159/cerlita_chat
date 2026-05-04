import { useAuthStore } from '../authStore';
import { authService } from '@/services/supabase/auth.service';
import { pushNotificationService } from '@/services/pushNotifications';

// Mocks
jest.mock('@/services/supabase/auth.service');
jest.mock('@/services/pushNotifications');

describe('authStore', () => {
  const mockUser = { 
    id: 'user-123', 
    email: 'test@example.com', 
    displayName: 'Test User',
    photoURL: null,
    isOnline: false,
    lastSeen: null,
    isTyping: false,
    pushToken: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset Zustand store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null
    });
  });

  it('debe iniciar sesión correctamente y configurar las notificaciones', async () => {
    (authService.signIn as jest.Mock).mockResolvedValue(mockUser);
    
    await useAuthStore.getState().signIn('test@example.com', 'password123');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(state.error).toBeNull();
    expect(authService.signIn).toHaveBeenCalledWith('test@example.com', 'password123');
  });

  it('debe manejar errores de inicio de sesión', async () => {
    const errorMessage = 'Credenciales inválidas';
    (authService.signIn as jest.Mock).mockRejectedValue(new Error(errorMessage));

    await expect(
      useAuthStore.getState().signIn('test@example.com', 'wrong')
    ).rejects.toThrow();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.error).toBe(errorMessage);
  });

  it('debe registrar un nuevo usuario correctamente', async () => {
    (authService.signUp as jest.Mock).mockResolvedValue(mockUser);

    await useAuthStore.getState().signUp('test@example.com', 'pass', 'Test User');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.isAuthenticated).toBe(true);
    expect(authService.signUp).toHaveBeenCalledWith('test@example.com', 'pass', 'Test User');
  });

  it('debe cerrar sesión y limpiar el estado', async () => {
    // Estado inicial autenticado
    useAuthStore.setState({ user: mockUser, isAuthenticated: true });

    await useAuthStore.getState().signOut();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(authService.signOut).toHaveBeenCalled();
    expect(pushNotificationService.cleanup).toHaveBeenCalled();
  });
});
