
import { jest } from '@jest/globals';

// Mock de Supabase para evitar errores de red en tests
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: () => ({ 
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis() 
    }),
    auth: { getSession: jest.fn() }
  })
}));

// Mock de Firebase
jest.mock('firebase/app', () => ({ initializeApp: jest.fn() }));
jest.mock('firebase/auth', () => ({ getAuth: jest.fn() }));
