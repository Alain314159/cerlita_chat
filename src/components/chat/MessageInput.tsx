import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, IconButton } from 'react-native-paper';
import { theme } from '@/config/theme';
import type { ReplyContext } from '@/types/message.types';
import { TermuxKeyBar, TermuxKey } from './TermuxKeyBar';

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttachmentPress?: () => void;
  onCameraPress?: () => void;
  onVoicePress?: () => void;
  replyContext?: ReplyContext | null;
  onReplyClose?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value, onChangeText, onSend, onAttachmentPress, onCameraPress, onVoicePress,
  disabled = false, placeholder = 'Escribe un mensaje...',
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const inputRef = useRef<any>(null);

  const hasText = value.trim().length > 0;

  const handleTermuxKeyPress = (key: TermuxKey) => {
    switch (key) {
      case 'TAB': {
        const tabValue = value.slice(0, selection.start) + '    ' + value.slice(selection.end);
        onChangeText(tabValue);
        const newTabPos = selection.start + 4;
        setSelection({ start: newTabPos, end: newTabPos });
        break;
      }
      case 'LEFT':
        if (selection.start > 0) {
          const newPos = selection.start - 1;
          setSelection({ start: newPos, end: newPos });
        }
        break;
      case 'RIGHT':
        if (selection.end < value.length) {
          const newPos = selection.end + 1;
          setSelection({ start: newPos, end: newPos });
        }
        break;
      case 'UP': {
        const lines = value.slice(0, selection.start).split('\n');
        if (lines.length > 1) {
          // Simplified up: find last newline before selection
          const lastNewline = value.lastIndexOf('\n', selection.start - 1);
          if (lastNewline !== -1) {
            const secondLastNewline = value.lastIndexOf('\n', lastNewline - 1);
            const lineOffset = selection.start - lastNewline - 1;
            const targetPos = Math.min(lastNewline, secondLastNewline + 1 + lineOffset);
            setSelection({ start: targetPos, end: targetPos });
          }
        }
        break;
      }
      case 'DOWN': {
        const nextNewline = value.indexOf('\n', selection.start);
        if (nextNewline !== -1) {
          const lastNewline = value.lastIndexOf('\n', selection.start - 1);
          const lineOffset = selection.start - lastNewline - 1;
          const followingNewline = value.indexOf('\n', nextNewline + 1);
          const targetPos = followingNewline === -1 
            ? Math.min(value.length, nextNewline + 1 + lineOffset)
            : Math.min(followingNewline, nextNewline + 1 + lineOffset);
          setSelection({ start: targetPos, end: targetPos });
        }
        break;
      }
      case '-':
      case '/': {
        const char = key === '-' ? '-' : '/';
        const newVal = value.slice(0, selection.start) + char + value.slice(selection.end);
        onChangeText(newVal);
        const newPos = selection.start + 1;
        setSelection({ start: newPos, end: newPos });
        break;
      }
      case 'ESC':
      case 'CTRL':
      case 'ALT':
        // These are often used as modifiers or special signals. 
        // In a chat app, we can just treat them as symbolic for now.
        break;
    }
  };

  return (
    <View style={styles.container}>
      {isFocused && <TermuxKeyBar onKeyPress={handleTermuxKeyPress} />}
      <View style={styles.inputRow}>
        <TouchableOpacity style={styles.attachButton} onPress={onAttachmentPress}>
          <IconButton icon="paperclip" size={22} iconColor={theme.colors.textSecondary} />
        </TouchableOpacity>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          mode="outlined"
          multiline
          maxLength={5000}
          style={styles.input}
          contentStyle={styles.inputContent}
          disabled={disabled}
          testID="message-input"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          selection={selection}
          onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
        />
        {hasText ? (
          <TouchableOpacity style={styles.sendButton} onPress={onSend} disabled={!hasText || disabled}>
            <IconButton icon="send" size={22} iconColor={theme.colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={styles.alternateButtons}>
            <IconButton icon="camera" size={22} iconColor={theme.colors.textSecondary} onPress={onCameraPress} />
            <IconButton icon="microphone" size={22} iconColor={theme.colors.textSecondary} onPress={onVoicePress} />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, padding: 8 },
  attachButton: { justifyContent: 'center', alignItems: 'center' },
  input: { flex: 1, backgroundColor: theme.colors.surface, maxHeight: 120 },
  inputContent: { minHeight: 40 },
  sendButton: { justifyContent: 'center', alignItems: 'center' },
  alternateButtons: { flexDirection: 'row' },
});
