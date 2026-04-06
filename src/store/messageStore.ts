import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Message } from '@/types';
import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';

interface MessageStore {
  // State
  messages: Message[];
  loading: boolean;
  error: string | null;
  typingUsers: Set<string>;
  channels: Map<string, RealtimeChannel>;

  // Actions
  loadMessages: (chatId: string) => Promise<void>;
  sendMessage: (
    chatId: string,
    senderId: string,
    text: string
  ) => Promise<void>;
  markAsRead: (messageId: string) => Promise<void>;
  markAllAsRead: (chatId: string, userId: string) => Promise<void>;
  subscribeToMessages: (chatId: string) => void;
  unsubscribeFromMessages: (chatId?: string) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
  setError: (error: string | null) => void;
}

export const useMessageStore = create<MessageStore>((set, get) => ({
  // Initial state
  messages: [],
  loading: false,
  error: null,
  typingUsers: new Set(),
  channels: new Map(),

  // Load messages
  loadMessages: async (chatId: string) => {
    try {
      set({ loading: true, error: null });

      const messages = await messageService.getMessages(chatId);

      // Decrypt messages
      const decryptedMessages = await Promise.all(
        messages.map(async (msg) => {
          if (msg.text) {
            try {
              const decrypted = await e2eEncryptionService.decrypt(
                msg.text,
                '', // IV stored in message if needed
                chatId
              );
              return { ...msg, text: decrypted };
            } catch (error) {
              console.error('Failed to decrypt message:', error);
              return msg;
            }
          }
          return msg;
        })
      );

      set({
        messages: decryptedMessages,
        loading: false,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load messages';
      set({
        loading: false,
        error: message,
      });
    }
  },

  // Send message
  sendMessage: async (chatId: string, senderId: string, text: string) => {
    try {
      set({ loading: true, error: null });

      // Encrypt message
      const { ciphertext, iv } = await e2eEncryptionService.encrypt(text, chatId);

      await messageService.sendMessage({
        chatId,
        senderId,
        content: ciphertext,
        messageType: 'text',
      });

      set({ loading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send message';
      set({
        loading: false,
        error: message,
      });
      throw error;
    }
  },

  // Mark as read
  markAsRead: async (messageId: string) => {
    try {
      await messageService.updateMessageStatus(messageId, 'read');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to mark as read';
      console.error('Failed to mark as read:', message);
    }
  },

  // Mark all as read
  markAllAsRead: async (chatId: string, userId: string) => {
    try {
      await messageService.markAllAsRead(chatId, userId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to mark all as read';
      console.error('Failed to mark all as read:', message);
    }
  },

  // Subscribe to messages (realtime)
  subscribeToMessages: async (chatId: string) => {
    const { channels, messages } = get();

    // Unsubscribe from previous if exists
    const existingChannel = channels.get(chatId);
    if (existingChannel) {
      existingChannel.unsubscribe();
      channels.delete(chatId);
    }

    const channel = messageService.subscribeToMessages(chatId, async (message: Message) => {
      const currentMessages = get().messages;

      // Decrypt if needed
      if (message.text) {
        try {
          const decrypted = await e2eEncryptionService.decrypt(
            message.text,
            '',
            chatId
          );
          message.text = decrypted;
        } catch (error) {
          console.error('Failed to decrypt message:', error);
        }
      }

      // Add or update message
      const existingIndex = currentMessages.findIndex((m) => m.id === message.id);
      if (existingIndex >= 0) {
        const updated = [...currentMessages];
        updated[existingIndex] = message;
        set({ messages: updated });
      } else {
        set({ messages: [...currentMessages, message] });
      }
    });

    channels.set(chatId, channel);
    set({ channels });
  },

  // Unsubscribe from messages
  unsubscribeFromMessages: (chatId?: string) => {
    const { channels } = get();
    if (chatId) {
      const channel = channels.get(chatId);
      if (channel) {
        channel.unsubscribe();
        channels.delete(chatId);
      }
    } else {
      channels.forEach((channel) => channel.unsubscribe());
      channels.clear();
    }
    set({ channels });
  },

  // Set typing status
  setTyping: (userId: string, isTyping: boolean) => {
    const { typingUsers } = get();
    const newTypingUsers = new Set(typingUsers);
    
    if (isTyping) {
      newTypingUsers.add(userId);
    } else {
      newTypingUsers.delete(userId);
    }
    
    set({ typingUsers: newTypingUsers });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));
