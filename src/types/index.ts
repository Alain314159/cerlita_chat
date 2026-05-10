// Core types for Cerlita Chat

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
  cerlitaId: string | null;
  photoURL: string | null;
  avatar?: AvatarOption;
  isOnline: boolean;
  lastSeen: string | null;
  isTyping: boolean;
  pushToken: string | null;
  createdAt: string;
  updatedAt: string;
}

// Chat types
export interface Chat {
  id: string;
  name?: string | null;
  type?: 'direct' | 'group';
  participant_ids: string[];
  recipient?: User | null;
  lastMessageId: string | null;
  lastMessage?: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// Message types
export type MessageType = 'text' | 'image' | 'video' | 'audio' | 'file';
export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
  keyVersion: string;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  type: MessageType;
  text: string | null; 
  mediaURL: string | null;
  thumbnailURL: string | null;
  status: MessageStatus;
  readAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  encryptedPayload?: EncryptedPayload;
  plaintext?: string;
  iv?: string; 
  isEdited: boolean;
  editedAt?: string | null;
  replyToId: string | null;
  isEphemeral?: boolean;
  isViewOnce?: boolean;
}

// UI & Context types
export interface ReplyContext {
  messageId: string;
  text: string | null;
  senderName: string;
  type: MessageType;
}

export interface ReactionCounts {
  [emoji: string]: { count: number; userReacted: boolean };
}

export interface MessageWithMeta extends Message {
  reactions?: ReactionCounts;
  replyContext?: ReplyContext | null;
  isStarred?: boolean;
  isSelected?: boolean;
}

// Auth types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Call types
export interface Call {
  id: string;
  chatId: string;
  callerId: string;
  receiverId: string;
  type: 'audio' | 'video';
  status: 'initiating' | 'ringing' | 'connected' | 'ended' | 'missed';
  startedAt: string;
  endedAt?: string;
}
