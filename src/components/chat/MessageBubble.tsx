import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Image } from 'expo-image';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { theme } from '@/config/theme';
import type { Message } from '@/types';
import type { ReplyContext } from '@/types/message.types';
import { ReplyThread } from './ReplyThread';
import { MessageReactions } from './MessageReactions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MessageBubbleProps {
  message: Message;
  isMyMessage: boolean;
  reactions?: Record<string, { count: number; userReacted: boolean }>;
  replyContext?: ReplyContext | null;
  onLongPress?: () => void;
  onReactionPress?: (emoji: string) => void;
  onReplyPress?: () => void;
  isStarred?: boolean;
}

// Constants outside component — avoid recreation on every render
const TYPE_EMOJIS: Record<string, string> = {
  image: '\u{1F4F7}',
  video: '\u{1F3A5}',
  audio: '\u{1F3A4}',
  file: '\u{1F4C4}',
};

const COMMON_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

const STATUS_CONFIG = [
  { status: 'read', icon: 'check-all' as const, colorKey: 'tickRead' },
  { status: 'delivered', icon: 'check-all' as const, colorKey: 'tickDelivered' },
  { status: 'sent', icon: 'check' as const, colorKey: 'tickDelivered' },
  { status: 'failed', icon: 'alert-circle' as const, colorKey: 'error' },
];

function StatusIcon({ status, readAt }: { status: string; readAt?: Date | string | null }) {
  const effectiveStatus = readAt ? 'read' : status;
  const config = STATUS_CONFIG.find((c) => c.status === effectiveStatus);
  if (!config) return null;
  return (
    <IconButton
      icon={config.icon}
      size={14}
      iconColor={theme.colors[config.colorKey as keyof typeof theme.colors]}
      style={styles.statusIcon}
    />
  );
}

export const MessageBubble = React.memo(function MessageBubble({
  message,
  isMyMessage,
  reactions,
  replyContext,
  onLongPress,
  onReactionPress,
  onReplyPress,
  isStarred,
}: MessageBubbleProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const renderContent = () => {
    if (message.isViewOnce && message.readAt && !isMyMessage) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.7 }}>
          <IconButton icon="eye-off-outline" size={20} iconColor={theme.colors.textSecondary} />
          <Text style={{ fontSize: 14, fontStyle: 'italic', color: theme.colors.textSecondary }}>Mensaje visto</Text>
        </View>
      );
    }
    if (message.type === 'image' && message.mediaURL) {
      return (
        <Image 
          source={{ uri: message.mediaURL }} 
          style={styles.mediaImage}
          contentFit="cover"
          transition={200}
        />
      );
    }
    return (
      <Text style={[styles.text, isMyMessage ? styles.myText : styles.theirText]}>
        {message.text}
        {message.isEdited && <Text style={styles.editedLabel}> (editado)</Text>}
      </Text>
    );
  };

  const handleLongPress = useCallback(() => {
    setShowEmojiPicker(true);
    onLongPress?.();
  }, [onLongPress]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    onReactionPress?.(emoji);
    setShowEmojiPicker(false);
  }, [onReactionPress]);

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      style={[styles.container, isMyMessage ? styles.myMessage : styles.theirMessage]}
      testID={`message-${message.id}`}
    >
      {replyContext && (
        <TouchableOpacity
          style={styles.replyThread}
          onPress={onReplyPress}
          activeOpacity={0.7}
        >
          <ReplyThread context={replyContext} isMyMessage={isMyMessage} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[styles.bubble, isMyMessage ? styles.myBubble : styles.theirBubble]}
        onLongPress={handleLongPress}
        activeOpacity={0.8}
      >
        {renderContent()}
        {reactions && (
          <MessageReactions
            reactions={reactions}
            onReactionPress={onReactionPress}
          />
        )}
        <View style={styles.meta}>
          {message.isEphemeral && (
            <IconButton icon="timer-outline" size={12} iconColor="rgba(255,255,255,0.5)" style={{ margin: 0, padding: 0, width: 14, height: 14 }} />
          )}
          {message.isViewOnce && (
            <IconButton icon="lightning-bolt" size={12} iconColor="rgba(255,255,255,0.5)" style={{ margin: 0, padding: 0, width: 14, height: 14 }} />
          )}
          <Text style={styles.time}>
            {format(new Date(message.createdAt), 'HH:mm', { locale: es })}
          </Text>
          {isMyMessage && <StatusIcon status={message.status} readAt={message.readAt} />}
        </View>
      </TouchableOpacity>
      {isStarred && (
        <View style={styles.starIndicator}>
          <IconButton icon="star" size={16} iconColor="#FFD700" style={styles.starIcon} />
        </View>
      )}

      <Modal
        visible={showEmojiPicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <Pressable 
          style={styles.modalOverlay} 
          onPress={() => setShowEmojiPicker(false)}
        >
          <Animated.View 
            entering={ZoomIn.duration(200)}
            style={[
              styles.emojiPicker,
              isMyMessage ? styles.myEmojiPicker : styles.theirEmojiPicker
            ]}
          >
            {COMMON_REACTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiButton}
                onPress={() => handleEmojiSelect(emoji)}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </Pressable>
      </Modal>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  container: { marginVertical: 2, maxWidth: '85%' },
  myMessage: { alignSelf: 'flex-end' },
  theirMessage: { alignSelf: 'flex-start' },
  replyThread: { marginBottom: 4 },
  bubble: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  myBubble: { backgroundColor: theme.colors.messageSent, borderBottomRightRadius: 4 },
  theirBubble: { backgroundColor: theme.colors.messageReceived, borderBottomLeftRadius: 4 },
  mediaImage: { width: 250, height: 250, borderRadius: 12, marginBottom: 4 },
  text: { fontSize: 15, lineHeight: 20 },
  myText: { color: theme.colors.messageSentText },
  theirText: { color: theme.colors.messageReceivedText },
  editedLabel: { fontSize: 11, fontStyle: 'italic', opacity: 0.6 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, justifyContent: 'flex-end' },
  time: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  statusIcon: { margin: 0, padding: 0, width: 18, height: 18, marginLeft: 2 },
  starIndicator: { position: 'absolute', top: -8, right: -8 },
  starIcon: { margin: 0 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiPicker: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: 8,
    borderRadius: 24,
    ...theme.shadows.md,
    gap: 8,
  },
  myEmojiPicker: { marginRight: 20 },
  theirEmojiPicker: { marginLeft: 20 },
  emojiButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  emojiText: { fontSize: 24 },
});
