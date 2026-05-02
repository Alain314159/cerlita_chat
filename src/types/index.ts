// User types
export interface AvatarOption {
  type: 'system' | 'custom';
  uri?: string;
  systemId?: number;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  avatar?: AvatarOption;
  isOnline: boolean;
  lastSeen: Date | null;
  isTyping: boolean;
  pushToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Chat types
export interface Chat {
  id: string;
  name?: string | null;
  type?: 'direct' | 'group';
  participants: string[]; // List of user IDs
  lastMessageId: string | null;
  lastMessage?: string | null;
  lastMessageAt: Date | null;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ParticipantInfo {
  displayName: string;
  photoURL: string | null;
  isOnline: boolean;
}

// Message types
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  text: string | null;
  mediaURL: string | null;
  thumbnailURL: string | null;
  status: MessageStatus;
  readAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  replyToId: string | null;
}

export interface MessageReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

// Auth types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export type {
  ReactionCounts,
  ReplyContext,
  MessageEdit,
  ForwardTarget,
  MessageAction,
  MessageWithMeta,
} from './message.types';
