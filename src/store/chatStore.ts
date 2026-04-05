import { create } from 'zustand';
import type { Chat } from '@/types';
import { chatService } from '@/services/supabase/chat.service';

interface ChatStore {
  // State
  chats: Chat[];
  loading: boolean;
  error: string | null;
  activeChat: Chat | null;

  // Actions
  loadChats: (userId: string) => Promise<void>;
  createChat: (userId1: string, userId2: string) => Promise<string>;
  setActiveChat: (chat: Chat | null) => void;
  subscribeToChats: (userId: string) => void;
  unsubscribeFromChats: () => void;
  setError: (error: string | null) => void;
}

let channel: any = null;

export const useChatStore = create<ChatStore>((set, get) => ({
  // Initial state
  chats: [],
  loading: false,
  error: null,
  activeChat: null,

  // Load chats
  loadChats: async (userId: string) => {
    try {
      set({ loading: true, error: null });
      
      const chats = await chatService.getUserChats(userId);
      
      set({
        chats,
        loading: false,
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to load chats',
      });
    }
  },

  // Create chat
  createChat: async (userId1: string, userId2: string) => {
    try {
      set({ loading: true, error: null });
      
      const chatId = await chatService.createChat(userId1, userId2);
      
      set({ loading: false });
      return chatId;
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Failed to create chat',
      });
      throw error;
    }
  },

  // Set active chat
  setActiveChat: (chat: Chat | null) => {
    set({ activeChat: chat });
  },

  // Subscribe to chats (realtime)
  subscribeToChats: (userId: string) => {
    // Unsubscribe from previous
    if (channel) {
      channel.unsubscribe();
    }

    channel = chatService.subscribeToUserChats(userId, (chats) => {
      set({ chats });
    });
  },

  // Unsubscribe from chats
  unsubscribeFromChats: () => {
    if (channel) {
      channel.unsubscribe();
      channel = null;
    }
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));
