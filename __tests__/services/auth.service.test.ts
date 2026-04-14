import { authService } from '@/services/supabase/auth.service';
import { supabase } from '@/services/supabase/config';

jest.mock('@/services/supabase/config', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      onAuthStateChange: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in with email and password', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };
      const mockSession = { access_token: 'token' };
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const result = await authService.signIn('test@test.com', 'password123');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
      expect(result.user).toEqual(mockUser);
      expect(result.session).toEqual(mockSession);
    });

    it('should throw error on sign in failure', async () => {
      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: null, session: null },
        error: { message: 'Invalid credentials' },
      });

      await expect(authService.signIn('test@test.com', 'wrong')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('signUp', () => {
    it('should sign up with email, password, and display name', async () => {
      const mockUser = { id: '1', email: 'new@test.com' };
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      // Mock user profile creation
      const mockChain = {
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await authService.signUp('new@test.com', 'password123', 'New User');

      expect(supabase.auth.signUp).toHaveBeenCalledWith({
        email: 'new@test.com',
        password: 'password123',
        options: {
          data: { display_name: 'New User' },
        },
      });
      expect(result.user).toEqual(mockUser);
    });

    it('should throw error on sign up failure', async () => {
      (supabase.auth.signUp as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Email already registered' },
      });

      await expect(authService.signUp('dup@test.com', 'pass', 'Dup')).rejects.toThrow(
        'Email already registered'
      );
    });
  });

  describe('signOut', () => {
    it('should sign out', async () => {
      (supabase.auth.signOut as jest.Mock).mockResolvedValue({ error: null });

      await authService.signOut();

      expect(supabase.auth.signOut).toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password for email', async () => {
      (supabase.auth.resetPasswordForEmail as jest.Mock).mockResolvedValue({ error: null });

      await authService.resetPassword('test@test.com');

      expect(supabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@test.com',
        { redirectTo: 'cerlitachat://reset-password' }
      );
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile', async () => {
      const mockUser = {
        id: '1',
        email: 'test@test.com',
        display_name: 'Test User',
        photo_url: null,
        is_online: true,
        last_seen_at: '2024-01-01T00:00:00Z',
        is_typing: false,
        push_token: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockUser, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await authService.getUserProfile('1');
      expect(result.id).toEqual(mockUser.id);
      expect(result.displayName).toEqual(mockUser.display_name);
    });
  });

  describe('onAuthStateChange', () => {
    it('should subscribe to auth state changes', async () => {
      const mockSubscription = { unsubscribe: jest.fn() };
      (supabase.auth.onAuthStateChange as jest.Mock).mockReturnValue({
        data: { subscription: mockSubscription },
      });

      const callback = jest.fn();
      const subscription = authService.onAuthStateChange(callback);

      expect(supabase.auth.onAuthStateChange).toHaveBeenCalled();
      expect(subscription).toEqual(mockSubscription);
    });
  });
});
