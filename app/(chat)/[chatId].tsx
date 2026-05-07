import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Text,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { useTheme, Button } from 'react-native-paper';
import { useQueryClient } from '@tanstack/react-query';
import { messageService } from '@/services/supabase/message.service';

import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { useChat } from '@/hooks/useChat';
import { theme as staticTheme } from '@/config/theme';
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
  const theme = useTheme();
  const flatListRef = useRef<FlashList<any>>(null);

  const {
    messages,
    loading,
    sending,
    sendMessage,
    subscribeToMessages,
    unsubscribeFromMessages,
    addReaction,
    replyContext,
    setReplyContext,
    isOtherUserTyping,
    queryResult,
  } = useMessages(chatId as string);

  const { activeChat, chats } = useChat(chatId as string);
  const [recipient, setRecipient] = useState<{displayName: string, photoURL?: string} | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Optimizar realtime: append a caché en lugar de refetch completo
  useEffect(() => {
    const subscription = messageService.subscribeToMessages(chatId as string, (payload) => {
      if (payload.eventType === 'INSERT' && payload.newRecord) {
        // Insertar nuevo mensaje al inicio de la primera página
        queryClient.setQueryData(['messages', chatId], (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: [
              [payload.newRecord, ...(old.pages[0] || [])],
              ...old.pages.slice(1)
            ]
          };
        });
      }
    });
    return () => { subscription.unsubscribe(); };
  }, [chatId, queryClient]);

  // Buscar el destinatario real para la cabecera
  useEffect(() => {
    const currentChat = activeChat || chats.find(c => c.id === chatId);
    if (currentChat && user) {
      // Si el chat tiene participantes (formato de getChatById)
      if (currentChat.participants && Array.isArray(currentChat.participants)) {
        const otherParticipant = (currentChat.participants as any[]).find(
          p => (p.user_id || p.id) !== user.id
        );
        
        if (otherParticipant) {
          // Si viene de chat_participants (nested users)
          const userData = otherParticipant.users || otherParticipant;
          setRecipient({
            displayName: userData.display_name || userData.displayName || 'Usuario',
            photoURL: userData.photo_url || userData.photoURL
          });
          return;
        }
      }
      
      // Fallback si es un chat con nombre (grupal o ya procesado)
      if (currentChat.name) {
        setRecipient({
          displayName: currentChat.name,
          photoURL: undefined
        });
      }
    }
  }, [chatId, activeChat, chats, user]);

  useEffect(() => {
    const subscription = subscribeToMessages(chatId as string);
    return () => {
      unsubscribeFromMessages();
    };
  }, [chatId]);

  const handleSendMessage = useCallback(async (options?: { isEphemeral?: boolean; isViewOnce?: boolean }) => {
    if (!messageText.trim()) return;
    
    const textToSend = messageText;
    setMessageText('');
    
    try {
      await sendMessage(textToSend, options);
      // Scroll to top/bottom depending on list direction
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessageText(textToSend); // Restore text on failure
    }
  }, [messageText, sendMessage]);

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.id;
    const prevMessage = messages[index + 1];
    const showDateHeader = !prevMessage || formatDateHeader(item.createdAt) !== formatDateHeader(prevMessage.createdAt);

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={[styles.dateHeaderText, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurfaceVariant }]}>
              {formatDateHeader(item.createdAt)}
            </Text>
          </View>
        )}
        <MessageBubble
          message={item}
          isMe={isMe}
          onReaction={(emoji) => addReaction(item.id, emoji)}
          onReply={() => setReplyContext({
            messageId: item.id,
            text: item.text,
            senderName: isMe ? 'Tú' : (recipient?.displayName || 'Usuario'),
            type: item.type
          })}
        />
      </View>
    );
  }, [user?.id, messages, recipient, addReaction, setReplyContext, theme]);

  if (queryResult.isError) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.error, marginBottom: 16 }}>Error al cargar mensajes</Text>
        <Button mode="contained" onPress={() => queryResult.refetch()}>
          Reintentar
        </Button>
      </View>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingBottom: insets.bottom, backgroundColor: theme.colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ChatHeader
        name={recipient?.displayName || activeChat?.name || undefined}
        photoUrl={recipient?.photoURL}
        isTyping={isOtherUserTyping()}
        loading={!recipient && !activeChat?.name}
        onOpenOptions={() => setShowOptionsMenu(true)}
      />

      <FlashList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        estimatedItemSize={70}
        contentContainerStyle={styles.listContent}
        inverted // Messages typically list from bottom to top
        onEndReached={() => {
          if (queryResult.hasNextPage && !queryResult.isFetchingNextPage) {
            queryResult.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        ListFooterComponent={() => 
          queryResult.isFetchingNextPage ? (
            <ActivityIndicator style={{ marginVertical: 10 }} color={theme.colors.primary} />
          ) : null
        }
      />

      {replyContext && (
        <ReplyPreview 
          context={replyContext} 
          onClose={() => setReplyContext(null)} 
        />
      )}

      <MessageInput
        value={messageText}
        onChangeText={setMessageText}
        onSend={handleSendMessage}
        onAttachmentPress={() => Alert.alert('Próximamente', 'La función de adjuntar archivos estará disponible pronto.')}
        onCameraPress={() => Alert.alert('Próximamente', 'La función de cámara estará disponible pronto.')}
        onVoicePress={() => Alert.alert('Próximamente', 'La función de voz estará disponible pronto.')}
        replyContext={replyContext}
        onReplyClose={() => setReplyContext(null)}
        disabled={sending}
      />

      <ChatOptionsMenu
        visible={showOptionsMenu}
        onClose={() => setShowOptionsMenu(false)}
        onClearChat={() => {}} // TODO
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 20,
  },
  dateHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
