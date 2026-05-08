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
  recipient?: User | null; // Info de la otra persona en chats directos
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
  ciphertext: string; // Base64 del contenido cifrado
  iv: string;         // Base64 del vector de inicialización (12 bytes para GCM)
  authTag: string;    // Base64 de la etiqueta de autenticación (16 bytes para GCM)
  keyVersion: string; // Para soportar rotación de claves
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
  encryptedPayload?: EncryptedPayload; // Para mensajes E2E
  plaintext?: string; // SOLO para caché local tras descifrar, NUNCA enviar al servidor
  iv?: string; 
  isEdited: boolean;
  editedAt?: string | null;
  replyToId: string | null;
  isEphemeral?: boolean;
  isViewOnce?: boolean;
}
