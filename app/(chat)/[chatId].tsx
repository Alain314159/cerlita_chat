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

  const { activeChat, chats } = useChat();
  const [recipient, setRecipient] = useState<{displayName: string, photoURL?: string} | null>(null);

  // Buscar el destinatario real para la cabecera
  useEffect(() => {
    const currentChat = activeChat || chats.find(c => c.id === chatId);
    if (currentChat && user) {
      // En chats directos, el nombre suele ser el del otro participante
      // Aquí podrías implementar una búsqueda en Supabase si el nombre no viene en el chat
      setRecipient({
        displayName: currentChat.name || 'Usuario',
        photoURL: undefined // TODO: Mapear foto real
      });
    }
  }, [chatId, activeChat, chats, user]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingBottom: insets.bottom }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ChatHeader
        name={recipient?.displayName || activeChat?.name || 'Cargando...'}
        photoUrl={recipient?.photoURL}
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
