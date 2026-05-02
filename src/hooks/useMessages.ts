import { useEffect, useCallback, useState } from 'react';
import { useMessageStore } from '@/store/messageStore';
import { useAuthStore } from '@/store/authStore';
import type { ReplyContext } from '@/types';

export function useMessages(chatId: string) {
  const {
    messages,
    loading,
    error,
    typingUsers,
    replyContext,
    loadMessages,
    sendMessage,
    markAsRead,
    markAllAsRead,
    addReaction,
    subscribeToMessages,
    unsubscribeFromMessages,
    setError,
    setReplyContext,
  } = useMessageStore();

  const { user } = useAuthStore();
  const [isTyping, setIsTyping] = useState(false);
  const [sending, setSending] = useState(false);

  // Send message
  const handleSendMessage = useCallback(async (text: string, options?: any) => {
    if (!user || !chatId) return;
    try {
      setSending(true);
      await sendMessage(chatId, user.id, text, options);
    } finally {
      setSending(false);
    }
  }, [user, chatId, sendMessage]);

  const handleAddReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;
    await addReaction(messageId, emoji, user.id);
  }, [user, addReaction]);

  const handleMarkAsRead = useCallback(async (messageId: string) => {
    if (!user) return;
    await markAsRead(messageId);
  }, [user, markAsRead]);

  const isOtherUserTyping = useCallback(() => {
    if (!user) return false;
    return Array.from(typingUsers).some((id) => id !== user.id);
  }, [typingUsers, user]);

  return {
    messages,
    loading,
    sending,
    error,
    isTyping,
    setIsTyping,
    isOtherUserTyping,
    loadMessages,
    subscribeToMessages,
    unsubscribeFromMessages,
    sendMessage: handleSendMessage,
    addReaction: handleAddReaction,
    markAsRead: handleMarkAsRead,
    setError,
    replyContext,
    setReplyContext,
  };
}
