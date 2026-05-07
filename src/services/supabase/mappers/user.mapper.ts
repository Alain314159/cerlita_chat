import type { User } from '@/types';

export const mapDatabaseUserToDomain = (dbUser: any): User => {
  if (!dbUser) return null as any;
  return {
    id: dbUser.id,
    email: dbUser.email,
    displayName: dbUser.display_name,
    photoURL: dbUser.photo_url,
    isOnline: dbUser.is_online,
    lastSeen: dbUser.last_seen_at,
    isTyping: dbUser.is_typing,
    pushToken: dbUser.push_token,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
};

export const mapDomainUserToDatabase = (updates: Partial<User>) => {
  const dbUpdates: any = {};
  if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
  if (updates.photoURL !== undefined) dbUpdates.photo_url = updates.photoURL;
  if (updates.isOnline !== undefined) dbUpdates.is_online = updates.isOnline;
  if (updates.pushToken !== undefined) dbUpdates.push_token = updates.pushToken;
  
  return dbUpdates;
};
