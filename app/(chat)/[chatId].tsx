import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';

import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { useChat } from '@/hooks/useChat';
import { theme } from '@/config/theme';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ReplyPreview } from '@/components/chat/ReplyPreview';
import { ChatOptionsMenu } from '@/components/chat/ChatOptionsMenu';
import { formatDateHeader } from '@/utils/date';
import { Message } from '@/types';

export default function ChatConversationScreen() {
  const { chatId } = useLocalSearchParams();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlashList<any>>(null);

  const {
    messages,
    loading,
    sending,
    loadMessages,
    sendMessage,
    subscribeToMessages,
    unsubscribeFromMessages,
    addReaction,
    replyContext,
    setReplyContext,
  } = useMessages(chatId as string);

  const { activeChat } = useChat();
  const [messageText, setMessageText] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);

  useEffect(() => {
    if (chatId) {
      loadMessages(chatId as string);
      subscribeToMessages(chatId as string);
    }
    return () => unsubscribeFromMessages(chatId as string);
  }, [chatId, loadMessages, subscribeToMessages, unsubscribeFromMessages]);

  const handleSendMessage = useCallback(async () => {
    if (!messageText.trim() || !user || !chatId) return;
    try {
      const textToSend = messageText.trim();
      setMessageText('');
      await sendMessage(chatId as string, user.id, textToSend);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }, [messageText, user, chatId, sendMessage]);

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMyMessage = item.senderId === user?.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDateHeader = !prevMessage || 
      new Date(item.createdAt).toDateString() !== new Date(prevMessage.createdAt).toDateString();

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <ActivityIndicator size="small" style={{ opacity: 0 }} />
          </View>
        )}
        <MessageBubble
          message={item}
          isMyMessage={isMyMessage}
          onReactionPress={(emoji) => addReaction(item.id, emoji, user?.id || '')}
        />
      </View>
    );
  }, [messages, user?.id, addReaction]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingBottom: insets.bottom }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ChatHeader
        name={activeChat?.name || 'Chat'}
        photoUrl={undefined}
        onOpenOptions={() => setShowOptionsMenu(true)}
      />

      <FlashList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        estimatedItemSize={70}
        contentContainerStyle={styles.listContent}
      />

      {replyContext && (
        <ReplyPreview 
          context={replyContext as any} 
          onClose={() => setReplyContext(null)} 
        />
      )}

      <MessageInput
        value={messageText}
        onChangeText={setMessageText}
        onSend={handleSendMessage}
        replyContext={replyContext as any}
        onReplyClose={() => setReplyContext(null)}
        disabled={sending}
      />

      <ChatOptionsMenu
        visible={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
});
