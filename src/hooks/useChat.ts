import { useEffect, useCallback } from 'react';
import { useChatStore } from '@/store/chatStore';
import { useAuthStore } from '@/store/authStore';
import { chatService } from '@/services/supabase/chat.service';

export function useChat(chatId?: string) {
  const {
    chats,
    activeChat,
    loading,
    error,
    loadChats,
    createChat,
    setActiveChat,
    subscribeToChats,
    unsubscribeFromChats,
    setError,
  } = useChatStore();

  const { user } = useAuthStore();

  // Subscribe to user's chats
  useEffect(() => {
    if (user) {
      subscribeToChats(user.id);
    }

    return () => {
      unsubscribeFromChats();
    };
  }, [user]);

  // Load specific chat
  useEffect(() => {
    if (chatId) {
      chatService.getChat(chatId).then((chat) => {
        setActiveChat(chat);
      }).catch(console.error);
    }
  }, [chatId]);

  // Get chat participants
  const getParticipants = useCallback(async () => {
    if (!chatId) return [];
    return chatService.getChatParticipants(chatId);
  }, [chatId]);

  return {
    chats,
    activeChat,
    loading,
    error,
    createChat,
    getParticipants,
    setActiveChat,
    setError,
  };
}
