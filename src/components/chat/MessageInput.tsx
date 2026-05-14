import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { TextInput, IconButton } from 'react-native-paper';
import { theme } from '@/config/theme';
import type { ReplyContext } from '@/types';
import { Paperclip, Send, Camera, Mic, Clock, Eye, EyeOff } from 'lucide-react-native';

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: (text: string, options?: { isEphemeral?: boolean; isViewOnce?: boolean }) => void;
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
  const inputRef = useRef<any>(null);

  const handleSend = () => {
    const text = value.trim();
    if (!text || isLoading) return;
    onSend(text, { isEphemeral, isViewOnce });
    onChangeText('');
    setIsEphemeral(false);
    setIsViewOnce(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <IconButton
          icon={({ size, color }) => <Paperclip size={size} color={color} />}
          onPress={onAttachmentPress}
          disabled={disabled || isLoading}
          iconColor={theme.colors.secondary}
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
            outlineStyle={{ borderRadius: 24, borderWidth: 1 }}
          />
          <View style={styles.privacyToggles}>
            <TouchableOpacity 
              style={[styles.toggle, isEphemeral && styles.toggleActive]}
              onPress={() => setIsEphemeral(!isEphemeral)}
            >
              <Clock 
                size={20} 
                color={isEphemeral ? theme.colors.primary : theme.colors.secondary} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.toggle, isViewOnce && styles.toggleActive]}
              onPress={() => setIsViewOnce(!isViewOnce)}
            >
              {isViewOnce ? (
                <EyeOff size={20} color={theme.colors.primary} />
              ) : (
                <Eye size={20} color={theme.colors.secondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
        {value.trim().length > 0 ? (
          <IconButton
            icon={({ size, color }) => <Send size={size} color={color} />}
            onPress={handleSend}
            disabled={disabled || isLoading}
            iconColor={theme.colors.primary}
            testID="send-button"
          />
        ) : (
          <View style={styles.alternateButtons}>
            <IconButton 
              icon={({ size, color }) => <Camera size={size} color={color} />}
              onPress={onCameraPress} 
              disabled={disabled || isLoading}
              iconColor={theme.colors.secondary}
              testID="camera-button"
            />
            <IconButton 
              icon={({ size, color }) => <Mic size={size} color={color} />}
              onPress={onVoicePress} 
              disabled={disabled || isLoading}
              iconColor={theme.colors.secondary}
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
  inputContent: { minHeight: 40, paddingRight: 80 },
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
