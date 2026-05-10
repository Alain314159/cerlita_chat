import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { TextInput, IconButton } from 'react-native-paper';
import { theme } from '@/config/theme';
import type { ReplyContext } from '@/types';
import { TermuxKeyBar, TermuxKey } from './TermuxKeyBar';
import { Paperclip, Send, Camera, Mic, Clock, EyeOff } from 'lucide-react-native';

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (options?: { isEphemeral?: boolean; isViewOnce?: boolean }) => void;
  onAttachmentPress?: () => void;
  onCameraPress?: () => void;
  onVoicePress?: () => void;
  replyContext?: ReplyContext | null;
  onReplyClose?: () => void;
  disabled?: boolean;
  placeholder?: string;
  isLoading?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  value, onChangeText, onSend, onAttachmentPress, onCameraPress, onVoicePress,
  disabled = false, placeholder = 'Escribe un mensaje...',
  isLoading = false
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [isViewOnce, setIsViewOnce] = useState(false);
  const [selection, setSelection] = useState({ start: 0, end: 0 });
  const inputRef = useRef<any>(null);

  const hasText = value.trim().length > 0;

  const handleSend = () => {
    if (!hasText || isLoading) return;
    onSend({ isEphemeral, isViewOnce });
    setIsEphemeral(false);
    setIsViewOnce(false);
  };

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
        break;
    }
  };

  return (
    <View style={styles.container}>
      {isFocused && <TermuxKeyBar onKeyPress={handleTermuxKeyPress} />}
      <View style={styles.inputRow}>
        <IconButton
          icon={() => <Paperclip size={22} color={theme.colors.secondary} />}
          onPress={onAttachmentPress}
          disabled={disabled || isLoading}
          testID="attachment-button"
        />
        <View style={styles.inputWrapper}>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            mode="outlined"
            multiline
            maxLength={2000}
            style={styles.input}
            contentStyle={styles.inputContent}
            disabled={disabled || isLoading}
            testID="message-input"
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            selection={selection}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
          />
          <View style={styles.privacyToggles}>
            <TouchableOpacity 
              style={[styles.toggle, isEphemeral && styles.toggleActive]}
              onPress={() => setIsEphemeral(!isEphemeral)}
            >
              <Clock size={16} color={isEphemeral ? theme.colors.primary : theme.colors.secondary} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggle, isViewOnce && styles.toggleActive]}
              onPress={() => setIsViewOnce(!isViewOnce)}
            >
              <EyeOff size={16} color={isViewOnce ? theme.colors.primary : theme.colors.secondary} />
            </TouchableOpacity>
          </View>
        </View>
        {hasText ? (
          <IconButton
            icon={() => <Send size={22} color={theme.colors.primary} />}
            onPress={handleSend}
            disabled={!hasText || disabled || isLoading}
            testID="send-button"
          />
        ) : (
          <View style={styles.alternateButtons}>
            <IconButton 
              icon={() => <Camera size={22} color={theme.colors.secondary} />} 
              onPress={onCameraPress} 
              disabled={disabled || isLoading}
              testID="camera-button"
            />
            <IconButton 
              icon={() => <Mic size={22} color={theme.colors.secondary} />} 
              onPress={onVoicePress} 
              disabled={disabled || isLoading}
              testID="voice-button"
            />
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { backgroundColor: theme.colors.background, borderTopWidth: 1, borderTopColor: theme.colors.border },
  inputRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, padding: 8 },
  inputWrapper: { flex: 1 },
  input: { backgroundColor: theme.colors.surface, maxHeight: 120 },
  inputContent: { minHeight: 40, paddingRight: 60 },
  privacyToggles: { 
    flexDirection: 'row', 
    position: 'absolute', 
    right: 8, 
    bottom: 12,
    gap: 8,
    alignItems: 'center'
  },
  toggle: {
    padding: 4,
    borderRadius: 12,
  },
  toggleActive: {
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  alternateButtons: { flexDirection: 'row' },
});
