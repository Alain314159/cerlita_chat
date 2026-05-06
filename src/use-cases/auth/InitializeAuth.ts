import type { User } from '@/types';

export interface InitializeAuthDependencies {
  getSession: () => Promise<any>;
  getUserProfile: (userId: string) => Promise<User>;
  updatePresence: (isOnline: boolean, userId: string) => Promise<void>;
  onAuthStateChange: (callback: (event: string, session: any) => void) => any;
}

export const InitializeAuthUseCase = async (
  deps: InitializeAuthDependencies,
  onUserChanged: (user: User | null) => void
) => {
  // 1. Check current session
  const { data: { session } } = await deps.getSession();
  
  if (session?.user) {
    const profile = await deps.getUserProfile(session.user.id);
    await deps.updatePresence(true, session.user.id);
    onUserChanged(profile);
  }

  // 2. Listen for future changes
  return deps.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      const profile = await deps.getUserProfile(session.user.id);
      if (event === 'SIGNED_IN') {
        await deps.updatePresence(true, session.user.id);
      }
      onUserChanged(profile);
    } else {
      onUserChanged(null);
    }
  });
};
