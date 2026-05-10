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
import { e2eEncryptionService } from '@/services/crypto/e2e.service';

import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/services/supabase/config';

export default function ChatConversationScreen() {
  const { chatId } = useLocalSearchParams();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const flatListRef = useRef<FlashList<any>>(null);

  // 🔧 FIX: Habilitar el hook solo si chatId es válido
  const isEnabled = !!chatId && typeof chatId === 'string' && chatId.length > 0;

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
  } = useMessages(isEnabled ? (chatId as string) : '');

  const sendMessageMutation = useSendMessageMutation(
    isEnabled ? (chatId as string) : ''
  );

  const { activeChat, chats } = useChat(chatId as string);
  const [recipient, setRecipient] = useState<{displayName: string, photoURL?: string} | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();

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
              photoURL: profile.photoURL || undefined
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

  const handleSendMessage = useCallback(async (text: string, options?: { isEphemeral?: boolean; isViewOnce?: boolean }) => {
    if (!text.trim() || !user?.id || !chatId) {
      console.warn('[handleSendMessage] Missing:', { 
        hasText: !!text.trim(), 
        hasUser: !!user?.id, 
        hasChatId: !!chatId 
      });
      return;
    }
    
    const textToSend = text.trim();
    setReplyContext(null);
    
    try {
      // 🔐 MAESTRO 2026: Recuperación Dinámica de Clave E2E
      // Si por alguna razón la clave local no existe (ej: reinstalación),
      // intentamos recuperarla/derivarla antes de que la mutation falle.
      try {
        await e2eEncryptionService.getChatKey(chatId as string);
      } catch (e) {
        console.log('[handleSendMessage] E2E key missing, attempting recovery handshake...');
        const participants = await messageService.getChatParticipants(chatId as string);
        const otherId = participants.find(id => id !== user.id);
        if (otherId) {
          await e2eEncryptionService.establishSharedKey(chatId as string, user.id, otherId);
          console.log('[handleSendMessage] Recovery handshake successful.');
        } else {
          throw new Error('No se pudo identificar al destinatario para el cifrado E2E.');
        }
      }

      await sendMessageMutation.mutateAsync({
        text: textToSend,
        senderId: user.id,
        chatId: chatId as string,
        ...options
      });
      
      console.log('[handleSendMessage] Message sent successfully');
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    } catch (error: any) {
      console.error('[handleSendMessage] Error sending message:', error);
      Alert.alert(
        'Error al enviar',
        error.message || 'No se pudo enviar el mensaje. Verifica tu conexión.',
        [{ text: 'OK' }]
      );
      setMessageText(textToSend); // Restaurar el texto solo si el envío falló definitivamente
    }
  }, [user?.id, chatId, sendMessageMutation]);

  const uploadMedia = async (uri: string, name: string, type: string) => {
    try {
      setIsUploading(true);
      const fileName = `${chatId}/${Date.now()}_${name}`;
      
      // Convert URI to Blob for upload
      const response = await fetch(uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('chat-media')
        .upload(fileName, blob, {
          contentType: type,
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('chat-media')
        .getPublicUrl(data.path);

      await sendMessageMutation.mutateAsync({
        text: '',
        senderId: user!.id,
        chatId: chatId as string,
        mediaURL: publicUrl,
        type: type.startsWith('image/') ? 'image' : (type.startsWith('video/') ? 'video' : 'file')
      } as any);

    } catch (error: any) {
      console.error('[uploadMedia] Error:', error);
      Alert.alert('Error', 'No se pudo subir el archivo: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleAttachmentPress = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const asset = result.assets[0];
      if (asset) {
        await uploadMedia(asset.uri, asset.name, asset.mimeType || 'application/octet-stream');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo seleccionar el archivo');
    }
  };

  const handleCameraPress = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Se necesita acceso a la cámara para tomar fotos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.8,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) return;
      const asset = result.assets[0];
      if (asset) {
        const name = asset.uri.split('/').pop() || 'camera_upload.jpg';
        await uploadMedia(asset.uri, name, asset.mimeType || 'image/jpeg');
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo abrir la cámara');
    }
  };

  const handleVoicePress = () => {
    Alert.alert('Próximamente', 'La grabación de voz estará disponible en la próxima actualización.');
  };

  const renderMessage = useCallback(({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.id;
    const prevMessage = messages[index + 1];
    
    const currentDate = new Date(item.createdAt);
    const prevDate = prevMessage ? new Date(prevMessage.createdAt) : null;
    
    const showDateHeader = !prevDate || formatDateHeader(currentDate) !== formatDateHeader(prevDate);

    return (
      <View>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={[styles.dateHeaderText, { backgroundColor: theme.colors.surfaceVariant, color: theme.colors.onSurfaceVariant }]}>
              {formatDateHeader(currentDate)}
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
        data={messages ?? []}
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
          (queryResult.isFetchingNextPage || isUploading) ? (
            <View style={{ marginVertical: 10 }}>
              {isUploading && <Text style={{ textAlign: 'center', fontSize: 12, color: theme.colors.primary, marginBottom: 5 }}>Subiendo archivo...</Text>}
              <ActivityIndicator color={theme.colors.primary} />
            </View>
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
        onAttachmentPress={handleAttachmentPress}
        onCameraPress={handleCameraPress}
        onVoicePress={handleVoicePress}
        replyContext={replyContext}
        onReplyClose={() => setReplyContext(null)}
        disabled={sending || isUploading}
        isLoading={isUploading}
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
