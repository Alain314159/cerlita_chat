import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, IconButton, ActivityIndicator } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList, ViewToken } from '@shopify/flash-list';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { useMessageStore } from '@/store/messageStore';
import { theme } from '@/config/theme';
import { format, isSameDay as isSameDayFn } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Message } from '@/types';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { ReplyPreview } from '@/components/chat/ReplyPreview';
import { ChatOptionsMenu } from '@/components/chat/ChatOptionsMenu';
import { ChatHeader } from '@/components/chat/ChatHeader';

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const flatListRef = useRef<FlashList<Message>>(null);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { user } = useAuth();
  const { activeChat } = useChat(chatId);
  const { 
    messages, 
    loading, 
    isOtherUserTyping, 
    sendMessage, 
    addReaction,
    markAsRead,
    replyContext, 
    setReplyContext 
  } = useMessages(chatId!);

  const reactions = useMessageStore(state => state.reactions);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      scrollTimeoutRef.current = setTimeout(() => { flatListRef.current?.scrollToEnd({ animated: true }); }, 100);
    }
    return () => { if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current); };
  }, [messages]);

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || sending) return;
    try { setSending(true); await sendMessage(messageText.trim()); setMessageText(''); }
    catch (error) { console.error('Failed to send:', error); }
    finally { setSending(false); }
  }, [messageText, sending, sendMessage]);

  const handleLongPress = useCallback((message: Message) => {
    setReplyContext({ 
      messageId: message.id, 
      senderName: message.senderId === user?.id ? 'Tu' : 'Otro', 
      text: message.text || 'Multimedia', 
      type: message.type 
    });
  }, [setReplyContext, user?.id]);

  const handleReactionPress = useCallback((messageId: string, emoji: string) => {
    if (user?.id) {
      addReaction(messageId, emoji, user.id);
    }
  }, [addReaction, user?.id]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<ViewToken> }) => {
    viewableItems.forEach(({ item, isViewable }) => {
      if (isViewable && item && (item as Message).senderId !== user?.id && !(item as Message).readAt) {
        markAsRead((item as Message).id);
      }
    });
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === user?.id;
    const idx = messages.indexOf(item);
    const prevMessage = idx > 0 ? messages[idx - 1] : null;
    const showDateHeader = !prevMessage || !isSameDayFn(new Date(item.createdAt), new Date(prevMessage.createdAt));
    
    // Get reaction counts for this message
    const msgReactions = reactions.get(item.id);
    const reactionCounts: Record<string, { count: number; userReacted: boolean }> = {};
    if (msgReactions) {
      msgReactions.forEach((users, emoji) => {
        reactionCounts[emoji] = { 
          count: users.length, 
          userReacted: users.includes(user?.id || '') 
        };
      });
    }

    return (
      <>
        {showDateHeader && (
          <View style={styles.dateHeader}><Text style={styles.dateHeaderText}>{formatDateHeader(new Date(item.createdAt))}</Text></View>
        )}
        <MessageBubble
          message={item} 
          isMyMessage={isMyMessage}
          reactions={reactionCounts}
          onLongPress={() => handleLongPress(item)}
          onReactionPress={(emoji) => handleReactionPress(item.id, emoji)}
        />
      </>
    );
  }, [messages, user?.id, handleLongPress, handleReactionPress, reactions]);

  const otherParticipant = activeChat?.participants?.find((p: any) => p.user_id !== user?.id)?.users || null;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingBottom: insets.bottom }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <ChatHeader 
        name={otherParticipant?.display_name || activeChat?.name || 'Chat'}
        isTyping={isOtherUserTyping()}
        isOnline={otherParticipant?.is_online}
        photoUrl={otherParticipant?.photo_url}
        onOpenOptions={() => setShowOptionsMenu(true)}
      />
      {loading && messages.length === 0 ? (
        <View style={styles.loadingContainer}><ActivityIndicator size="large" color={theme.colors.primary} /></View>
      ) : (
        <FlashList 
          ref={flatListRef} 
          data={messages} 
          keyExtractor={(item) => item.id}
          renderItem={renderMessage} 
          estimatedItemSize={60} 
          contentContainerStyle={styles.messagesList} 
          removeClippedSubviews
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
        />
      )}
      {replyContext && <ReplyPreview context={replyContext} onClose={() => setReplyContext(null)} />}
      <MessageInput value={messageText} onChangeText={setMessageText} onSend={handleSendMessage}
        replyContext={replyContext} onReplyClose={() => setReplyContext(null)} disabled={sending} />
      <ChatOptionsMenu visible={showOptionsMenu} onClose={() => setShowOptionsMenu(false)} />
    </KeyboardAvoidingView>
  );
}

function formatDateHeader(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth() && date.getDate() === today.getDate()) return 'Hoy';
  if (date.getFullYear() === yesterday.getFullYear() && date.getMonth() === yesterday.getMonth() && date.getDate() === yesterday.getDate()) return 'Ayer';
  return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  headerInfo: { flex: 1, marginLeft: theme.spacing.sm },
  headerName: { fontSize: 16, fontWeight: '600', color: theme.colors.textPrimary },
  typingText: { fontSize: 12, color: theme.colors.typing, fontStyle: 'italic' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  messagesList: { padding: theme.spacing.md },
  dateHeader: { alignItems: 'center', marginVertical: theme.spacing.md },
  dateHeaderText: { fontSize: 12, color: theme.colors.textSecondary, backgroundColor: theme.colors.secondaryLight, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.sm },
});
