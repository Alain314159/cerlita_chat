import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Avatar, TextInput, IconButton, ActivityIndicator } from 'react-native-paper';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/hooks/useAuth';
import { useChat } from '@/hooks/useChat';
import { theme } from '@/config/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Message } from '@/types';

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const { user } = useAuth();
  const { activeChat } = useChat(chatId);
  const {
    messages,
    loading,
    isOtherUserTyping,
    sendMessage,
  } = useMessages(chatId!);

  const router = useRouter();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || sending) return;

    try {
      setSending(true);
      await sendMessage(messageText.trim());
      setMessageText('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item, index }: any) => {
    const isMyMessage = item.senderId === user?.id;
    const prevMessage = index > 0 ? messages[index - 1] : null;
    const showDateHeader = !prevMessage || !isSameDay(
      new Date(item.createdAt),
      new Date(prevMessage.createdAt)
    );

    return (
      <>
        {showDateHeader && (
          <View style={styles.dateHeader}>
            <Text style={styles.dateHeaderText}>
              {formatDateHeader(new Date(item.createdAt))}
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={[
            styles.messageContainer,
            isMyMessage ? styles.myMessage : styles.theirMessage,
          ]}
          onLongPress={() => {
            // Show message options (copy, delete, etc.)
          }}
        >
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myBubble : styles.theirBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                isMyMessage ? styles.myText : styles.theirText,
              ]}
            >
              {item.text}
            </Text>
          </View>

          <View
            style={[
              styles.messageMeta,
              isMyMessage ? styles.myMeta : styles.theirMeta,
            ]}
          >
            <Text style={styles.messageTime}>
              {format(new Date(item.createdAt), 'HH:mm', { locale: es })}
            </Text>
            {isMyMessage && <MessageStatus status={item.status} />}
          </View>
        </TouchableOpacity>
      </>
    );
  };

  const otherParticipant = activeChat?.participants.find((p) => p !== user?.id);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          onPress={() => router.back()}
          size={24}
        />
        
        <Avatar.Image
          size={40}
          source={require('@/assets/images/default-avatar.png')}
        />
        
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>
            {activeChat?.participantsInfo[otherParticipant || '']?.displayName || 'Chat'}
          </Text>
          {isOtherUserTyping() && (
            <Text style={styles.typingText}>escribiendo...</Text>
          )}
        </View>

        <IconButton
          icon="dots-vertical"
          onPress={() => {
            // Show chat options
          }}
        />
      </View>

      {/* Messages */}
      {loading && messages.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesList}
        />
      )}

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Escribe un mensaje..."
          mode="outlined"
          multiline
          maxLength={5000}
          style={styles.input}
          contentStyle={styles.inputContent}
          right={
            <TextInput.Icon
              icon="send"
              onPress={handleSendMessage}
              disabled={!messageText.trim() || sending}
              color={theme.colors.primary}
            />
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

// Message Status Component
function MessageStatus({ status }: { status: string }) {
  const icon = status === 'read' ? 'check-all' : status === 'delivered' ? 'check-all' : 'check';
  const color = status === 'read' ? theme.colors.tickRead : theme.colors.tickDelivered;

  return (
    <IconButton
      icon={icon}
      size={16}
      iconColor={color}
      style={styles.statusIcon}
    />
  );
}

// Helper functions
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatDateHeader(date: Date): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (isSameDay(date, today)) {
    return 'Hoy';
  } else if (isSameDay(date, yesterday)) {
    return 'Ayer';
  } else {
    return format(date, "d 'de' MMMM 'de' yyyy", { locale: es });
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerInfo: {
    flex: 1,
    marginLeft: theme.spacing.sm,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  typingText: {
    fontSize: 12,
    color: theme.colors.typing,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: theme.spacing.md,
  },
  dateHeader: {
    alignItems: 'center',
    marginVertical: theme.spacing.md,
  },
  dateHeaderText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    backgroundColor: theme.colors.secondaryLight,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  messageContainer: {
    marginVertical: 2,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
  },
  theirMessage: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
  },
  myBubble: {
    backgroundColor: theme.colors.messageSent,
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: theme.colors.messageReceived,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myText: {
    color: theme.colors.messageSentText,
  },
  theirText: {
    color: theme.colors.messageReceivedText,
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginHorizontal: theme.spacing.xs,
  },
  myMeta: {
    justifyContent: 'flex-end',
  },
  theirMeta: {
    justifyContent: 'flex-start',
  },
  messageTime: {
    fontSize: 10,
    color: theme.colors.textTertiary,
  },
  statusIcon: {
    margin: 0,
    padding: 0,
    width: 16,
    height: 16,
  },
  inputContainer: {
    padding: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  input: {
    backgroundColor: theme.colors.background,
  },
  inputContent: {
    minHeight: 40,
    maxHeight: 120,
  },
});
