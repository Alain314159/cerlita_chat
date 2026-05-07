import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { IconButton } from 'react-native-paper';
import { Image } from 'expo-image';
import Animated, { FadeInUp, ZoomIn } from 'react-native-reanimated';
import { useTheme } from 'react-native-paper';
import type { Message } from '@/types';
import type { ReplyContext } from '@/types/message.types';
import { ReplyThread } from './ReplyThread';
import { MessageReactions } from './MessageReactions';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  reactions?: Record<string, { count: number; userReacted: boolean }>;
  replyContext?: ReplyContext | null;
  onLongPress?: () => void;
  onReaction?: (emoji: any) => void;
  onReply?: () => void;
  isStarred?: boolean;
}

const COMMON_REACTIONS = ['❤️', '👍', '😂', '😮', '😢', '🙏'];

const STATUS_CONFIG = [
  { status: 'read', icon: 'check-all' as const, colorKey: 'tickRead' },
  { status: 'delivered', icon: 'check-all' as const, colorKey: 'tickDelivered' },
  { status: 'sent', icon: 'check' as const, colorKey: 'tickDelivered' },
  { status: 'failed', icon: 'alert-circle' as const, colorKey: 'error' },
];

function StatusIcon({ status, readAt }: { status: string; readAt?: Date | string | null }) {
  const theme = useTheme();
  const effectiveStatus = readAt ? 'read' : status;
  const config = STATUS_CONFIG.find((c) => c.status === effectiveStatus);
  if (!config) return null;
  return (
    <IconButton
      icon={config.icon}
      size={14}
      iconColor={(theme.colors as Record<string, string>)[config.colorKey] || theme.colors.primary}
      style={styles.statusIcon}
    />
  );
}

export const MessageBubble = React.memo(function MessageBubble({
  message,
  isMe,
  reactions,
  replyContext,
  onLongPress,
  onReaction,
  onReply,
  isStarred,
}: MessageBubbleProps) {
  const theme = useTheme();
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const renderContent = () => {
    if (message.isViewOnce && message.readAt && !isMe) {
      return (
        <View style={{ flexDirection: 'row', alignItems: 'center', opacity: 0.7 }}>
          <IconButton icon="eye-off-outline" size={20} iconColor={theme.colors.onSurfaceVariant} />
          <Text style={{ fontSize: 14, fontStyle: 'italic', color: theme.colors.onSurfaceVariant }}>Mensaje visto</Text>
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
      <Text style={[
        styles.text, 
        { color: isMe ? '#FFFFFF' : theme.colors.onSurface }
      ]}>
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
    onReaction?.(emoji);
    setShowEmojiPicker(false);
  }, [onReaction]);

  return (
    <Animated.View
      entering={FadeInUp.duration(300)}
      style={[styles.container, isMe ? styles.myMessage : styles.theirMessage]}
      testID={`message-${message.id}`}
    >
      {replyContext && (
        <TouchableOpacity
          style={styles.replyThread}
          onPress={onReply}
          activeOpacity={0.7}
        >
          <ReplyThread context={replyContext} isMyMessage={isMe} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        style={[
          styles.bubble, 
          isMe ? styles.myBubble : styles.theirBubble,
          { backgroundColor: isMe ? theme.colors.primary : theme.colors.surfaceVariant }
        ]}
        onLongPress={handleLongPress}
        activeOpacity={0.8}
      >
        {renderContent()}
        {reactions && (
          <MessageReactions
            reactions={reactions}
            onReactionPress={onReaction}
          />
        )}
        <View style={styles.meta}>
          {message.isEphemeral && (
            <IconButton icon="timer-outline" size={12} iconColor="rgba(255,255,255,0.5)" style={{ margin: 0, padding: 0, width: 14, height: 14 }} />
          )}
          {message.isViewOnce && (
            <IconButton icon="lightning-bolt" size={12} iconColor="rgba(255,255,255,0.5)" style={{ margin: 0, padding: 0, width: 14, height: 14 }} />
          )}
          <Text style={[styles.time, { color: isMe ? 'rgba(255,255,255,0.7)' : theme.colors.onSurfaceVariant }]}>
            {format(new Date(message.createdAt), 'HH:mm', { locale: es })}
          </Text>
          {isMe && <StatusIcon status={message.status} readAt={message.readAt} />}
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
              isMe ? styles.myEmojiPicker : styles.theirEmojiPicker
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
  myBubble: { borderBottomRightRadius: 4 },
  theirBubble: { borderBottomLeftRadius: 4 },
  mediaImage: { width: 250, height: 250, borderRadius: 12, marginBottom: 4 },
  text: { fontSize: 15, lineHeight: 20 },
  editedLabel: { fontSize: 11, fontStyle: 'italic', opacity: 0.6 },
  meta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, justifyContent: 'flex-end' },
  time: { fontSize: 10 },
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
    padding: 8,
    borderRadius: 24,
    gap: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  myEmojiPicker: { marginRight: 20 },
  theirEmojiPicker: { marginLeft: 20 },
  emojiButton: {
    padding: 8,
    borderRadius: 20,
  },
  emojiText: { fontSize: 24 },
});
