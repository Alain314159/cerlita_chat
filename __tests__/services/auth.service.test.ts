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
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signIn', () => {
    it('should sign in and return profile', async () => {
      const mockUser = { id: '1', email: 'test@test.com' };
      const mockSession = { access_token: 'token' };
      const mockDbUser = { 
        id: '1', 
        email: 'test@test.com', 
        display_name: 'Test',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      (supabase.auth.signInWithPassword as jest.Mock).mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null,
      });

      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockDbUser, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await authService.signIn('test@test.com', 'password123');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith('users');
      expect(result.id).toEqual('1');
      expect(result.displayName).toEqual('Test');
    });
  });

  describe('getUserProfile', () => {
    it('should get user profile and map to domain', async () => {
      const mockDbUser = {
        id: '1',
        display_name: 'Test User',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: mockDbUser, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await authService.getUserProfile('1');
      expect(result.displayName).toEqual('Test User');
      expect(result.id).toEqual('1');
    });
  });
});
