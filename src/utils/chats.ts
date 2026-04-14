import type { Chat, User } from '@/types';

// Get other participant's info from a direct chat
export const getOtherParticipant = (
  chat: Chat,
  currentUserId: string
): User | null => {
  if (chat.type !== 'direct') {
    return null;
  }

  const participants = chat.participants as string[];
  const otherUserId = participants.find((id) => id !== currentUserId);

  if (!otherUserId) {
    return null;
  }

  // If we have participants info, return it
  if (chat.participantsInfo[otherUserId]) {
    const info = chat.participantsInfo[otherUserId];
    return {
      id: otherUserId,
      email: '',
      displayName: info.displayName,
      photoURL: info.photoURL,
      isOnline: info.isOnline,
      lastSeen: null,
      isTyping: false,
      pushToken: null,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
    };
  }

  return null;
};

// Get chat display name
export const getChatDisplayName = (
  chat: Chat,
  currentUserId: string
): string => {
  if (chat.name) {
    return chat.name;
  }

  if (chat.type === 'direct') {
    const other = getOtherParticipant(chat, currentUserId);
    return other?.displayName || 'Chat';
  }

  return 'Grupo';
};

// Generate chat ID from two user IDs (for direct chats)
export const generateChatId = (userId1: string, userId2: string): string => {
  const ids = [userId1, userId2].sort();
  return `${ids[0]}_${ids[1]}`;
};

// Check if chat is muted (placeholder for future feature)
export const isChatMuted = (chat: Chat): boolean => {
  return false;
};

// Get unread count from chat
export const getUnreadCount = (chat: Chat): number => {
  return chat.unreadCount || 0;
};
