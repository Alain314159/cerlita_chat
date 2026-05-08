import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
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
import { useSendMessageMutation } from '@/hooks/useSendMessageMutation';
import { theme as staticTheme } from '@/config/theme';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { MessageInput } from '@/components/chat/MessageInput';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { ReplyPreview } from '@/components/chat/ReplyPreview';
import { ChatOptionsMenu } from '@/components/chat/ChatOptionsMenu';
import { formatDateHeader } from '@/utils/date';
import { Message, User } from '@/types';
import { userService } from '@/services/supabase/user.service';

export default function ChatConversationScreen() {
  const { chatId } = useLocalSearchParams();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const flatListRef = useRef<FlashList<any>>(null);

  // 🔧 FIX: Habilitar el hook solo si chatId es válido
  const isEnabled = !!chatId && typeof chatId === 'string' && chatId.length > 0;

  const {
    messages: initialMessages,
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
  } = useMessages(isEnabled ? (chatId as string) : '');

  const sendMessageMutation = useSendMessageMutation(chatId as string);

  // messages viene del hook con select que ya aplana, pero agregamos protección extra
  const messagesArray = React.useMemo(() => {
    const data = queryResult.data;
    
    if (!data) return initialMessages || [];
    
    if (Array.isArray(data)) {
      return data.filter((m): m is Message => m !== null && m !== undefined && typeof m === 'object');
    }
    
    if (typeof data === 'object' && 'pages' in data && Array.isArray((data as any).pages)) {
      return (data as any).pages
        .flatMap((page: any) => page ?? [])
        .filter((m: any): m is Message => m !== null && m !== undefined && typeof m === 'object');
    }
    
    console.warn('[ChatScreen] Unexpected data structure:', data);
    return initialMessages || [];
  }, [queryResult.data, initialMessages]);

  const { activeChat, chats } = useChat(chatId as string);
  const [recipient, setRecipient] = useState<{displayName: string, photoURL?: string} | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Optimizar realtime: append a caché en lugar de refetch completo
  useEffect(() => {
    // No suscribirse si no hay chatId válido
    if (!chatId || typeof chatId !== 'string') return;
    
    let isSubscribed = true;
    
    const subscription = messageService.subscribeToMessages(chatId, (payload) => {
      // Verificar que el componente aún está montado antes de actuar
      if (!isSubscribed) return;
      
      if (payload?.eventType === 'INSERT' && payload?.new) {
        // En lugar de refetch completo, append a caché si es posible
        queryClient.setQueryData(['messages', chatId], (old: any) => {
          if (!old) return old;
          
          // Si es InfiniteData con pages
          if (old.pages && Array.isArray(old.pages)) {
            const newPages = [...old.pages];
            // Insertar al inicio de la primera página
            newPages[0] = [payload.new, ...(newPages[0] || [])];
            
            return {
              ...old,
              pages: newPages
            };
          }
          
          // Si ya está aplanado por el select (fallback)
          if (Array.isArray(old)) {
            return [payload.new, ...old];
          }
          
          return old;
        });
      }
    });

    // Cleanup: desuscribir al desmontar o cambiar chatId
    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, [chatId, queryClient]);

  useEffect(() => {
    const loadRecipient = async () => {
      if (!chatId || !user?.id) {
        console.warn('[loadRecipient] Missing chatId or userId');
        return;
      }
      
      try {
        console.log('[loadRecipient] Loading for chatId:', chatId);
        setRecipient(null); // Limpiar estado anterior
        
        const participants = await messageService.getChatParticipants(chatId as string);
        console.log('[loadRecipient] Participants:', participants);
        
        const otherId = participants.find(id => id !== user.id);
        console.log('[loadRecipient] Other ID:', otherId);
        
        if (otherId) {
          const profile = await userService.getUserById(otherId);
          console.log('[loadRecipient] Profile loaded:', profile);
          if (profile) {
            setRecipient({
              displayName: profile.displayName || 'Usuario',
              photoURL: profile.photoURL
            });
          }
        } else {
          console.warn('[loadRecipient] Could not find other participant');
        }
      } catch (error) {
        console.error('[loadRecipient] Error:', error);
        setRecipient(null);
      }
    };
    
    loadRecipient();
  }, [chatId, user?.id]);

  const handleSendMessage = useCallback(async (options?: { isEphemeral?: boolean; isViewOnce?: boolean }) => {
    if (!messageText.trim() || !user?.id || !chatId) {
      console.warn('[handleSendMessage] Missing:', { 
        hasText: !!messageText.trim(), 
        hasUser: !!user?.id, 
        hasChatId: !!chatId 
      });
      return;
    }
    
    const textToSend = messageText.trim();
    setMessageText('');
    setReplyContext(null);
    
    console.log('[handleSendMessage] Sending message:', { 
      text: textToSend, 
      chatId, 
      senderId: user.id,
      options 
    });

    try {
      // Usar sendMessageMutation del hook useMessages (vía queryResult si está disponible, o inyectado)
      // Nota: En este componente useMessages retorna queryResult, pero no expone directamente el mutation.
      // Sin embargo, useMessages tiene un sendMessage interno que llama a messageStore.
      // Pero el usuario sugirió usar sendMessageMutation.mutateAsync.
      // Vamos a verificar useMessages.ts para ver si expone el mutation.
      await sendMessageMutation.mutateAsync({
        text: textToSend,
        senderId: user.id,
        chatId: chatId as string,
        ...options
      });
      console.log('[handleSendMessage] Message sent successfully');
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error) {
      console.error('[handleSendMessage] Error sending message:', error);
      Alert.alert(
        'Error al enviar',
        'No se pudo enviar el mensaje. Verifica tu conexión.',
        [{ text: 'OK' }]
      );
      setMessageText(textToSend); // Restore text on failure
    }
  }, [messageText, user?.id, chatId, sendMessageMutation]);

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.id;
    const prevMessage = messagesArray[index + 1];
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
  }, [user?.id, messagesArray, recipient, addReaction, setReplyContext, theme]);

  // Si el chat no está habilitado, mostrar placeholder
  if (!isEnabled) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

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

  if (loading && messagesArray.length === 0) {
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
        data={messagesArray ?? []}
        keyExtractor={(item) => item?.id ?? `fallback-${Math.random()}`}
        renderItem={({ item, index }) => {
          if (!item) return null;
          return renderMessage({ item, index });
        }}
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
