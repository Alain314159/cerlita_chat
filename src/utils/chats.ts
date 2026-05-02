import { Chat, User } from '@/types';

export const getOtherParticipantId = (chat: Chat, currentUserId: string): string | null => {
  return chat.participants.find(id => id !== currentUserId) || null;
};

export const getChatDisplayName = (chat: Chat, currentUserId: string, otherUserInfo?: any): string => {
  if (chat.name) return chat.name;
  
  if (chat.type === 'direct' && otherUserInfo) {
    return otherUserInfo.display_name || otherUserInfo.email || 'Usuario';
  }
  
  return chat.name || 'Chat';
};

export const getChatDisplayAvatar = (chat: Chat, otherUserInfo?: any): string | null => {
  if (chat.type === 'direct' && otherUserInfo) {
    return otherUserInfo.photo_url || null;
  }
  return null;
};
