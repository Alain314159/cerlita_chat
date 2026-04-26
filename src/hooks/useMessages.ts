import { useEffect, useCallback, useState } from 'react';
import { useMessageStore } from '@/store/messageStore';
import { useAuthStore } from '@/store/authStore';
import type { ReplyContext } from '@/types/message.types';

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

  // Load messages
  useEffect(() => {
    if (chatId) {
      loadMessages(chatId);
      subscribeToMessages(chatId);
    }
    return () => { if (chatId) unsubscribeFromMessages(chatId); };
  }, [chatId, loadMessages, subscribeToMessages, unsubscribeFromMessages]);

  // Mark all as read when opening chat
  useEffect(() => {
    if (chatId && user) {
      markAllAsRead(chatId, user.id);
    }
  }, [chatId, user, markAllAsRead]);

  // Send message
  const handleSendMessage = useCallback(async (text: string) => {
    if (!user || !chatId) return;
    await sendMessage(chatId, user.id, text);
  }, [user, chatId, sendMessage]);

  const handleAddReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;
    await addReaction(messageId, user.id, emoji);
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
    error,
    isTyping,
    setIsTyping,
    isOtherUserTyping,
    sendMessage: handleSendMessage,
    addReaction: handleAddReaction,
    markAsRead: handleMarkAsRead,
    setError,
    replyContext,
    setReplyContext: setReplyContext as (context: ReplyContext | null) => void,
  };
}
