import { create } from 'zustand';
import type { Message } from '@/types';
import { messageService } from '@/services/supabase/message.service';
import { e2eEncryptionService } from '@/services/crypto/e2e.service';

interface MessageStore {
  // State
  messages: Message[];
  loading: boolean;
  error: string | null;
  typingUsers: Set<string>;

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
  unsubscribeFromMessages: () => void;
  setTyping: (userId: string, isTyping: boolean) => void;
  setError: (error: string | null) => void;
}

let channel: any = null;

export const useMessageStore = create<MessageStore>((set, get) => ({
  // Initial state
  messages: [],
  loading: false,
  error: null,
  typingUsers: new Set(),

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
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to load messages',
      });
    }
  },

  // Send message
  sendMessage: async (chatId: string, senderId: string, text: string) => {
    try {
      set({ loading: true, error: null });
      
      // Encrypt message
      const { ciphertext, iv } = await e2eEncryptionService.encrypt(text, chatId);
      
      await messageService.sendMessage(
        chatId,
        senderId,
        ciphertext,
        'text'
      );
      
      set({ loading: false });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to send message',
      });
      throw error;
    }
  },

  // Mark as read
  markAsRead: async (messageId: string) => {
    try {
      await messageService.markAsRead(messageId);
    } catch (error: any) {
      console.error('Failed to mark as read:', error);
    }
  },

  // Mark all as read
  markAllAsRead: async (chatId: string, userId: string) => {
    try {
      await messageService.markAllAsRead(chatId, userId);
    } catch (error: any) {
      console.error('Failed to mark all as read:', error);
    }
  },

  // Subscribe to messages (realtime)
  subscribeToMessages: async (chatId: string) => {
    // Unsubscribe from previous
    if (channel) {
      channel.unsubscribe();
    }

    channel = messageService.subscribeToMessages(chatId, async (message) => {
      const { messages } = get();
      
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
      const existingIndex = messages.findIndex((m) => m.id === message.id);
      if (existingIndex >= 0) {
        const updated = [...messages];
        updated[existingIndex] = message;
        set({ messages: updated });
      } else {
        set({ messages: [...messages, message] });
      }
    });
  },

  // Unsubscribe from messages
  unsubscribeFromMessages: () => {
    if (channel) {
      channel.unsubscribe();
      channel = null;
    }
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
