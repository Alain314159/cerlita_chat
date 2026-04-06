# Project Structure Guidelines

## Expo Router File-Based Routing

### Directory Layout

```
app/
├── _layout.tsx                    # Root layout with providers
├── (auth)/                        # Auth route group
│   ├── _layout.tsx               # Auth layout (no header)
│   ├── login.tsx                 # /login
│   ├── register.tsx              # /register
│   └── forgot-password.tsx       # /forgot-password
├── (chat)/                        # Chat route group
│   ├── _layout.tsx               # Chat layout with header
│   ├── index.tsx                 # / (chat list)
│   └── [chatId].tsx              # /:chatId (individual chat)
└── +not-found.tsx                 # 404 page
```

### Route Groups

Route groups (parentheses) organize routes without affecting URL:

```typescript
// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}

// app/(chat)/_layout.tsx
import { Stack } from 'expo-router';

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FF69B4' },
        headerTintColor: '#fff',
      }}
    />
  );
}
```

### Dynamic Routes

```typescript
// app/(chat)/[chatId].tsx
import { useLocalSearchParams } from 'expo-router';

export default function ChatScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  
  // Use chatId to fetch messages
  const messages = useMessages(chatId);
  
  return <MessageList messages={messages} />;
}
```

## Component Organization

### When to Create a Component

Create a component when:
1. Used in 2+ places (reusability)
2. Complex enough to warrant isolation (complexity)
3. Has its own state/logic (encapsulation)
4. Makes screen more readable (clarity)

### Component Types

```
src/components/
├── ui/                          # Base UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Avatar.tsx
│   ├── Badge.tsx
│   └── LoadingSpinner.tsx
├── chat/                        # Chat-specific
│   ├── MessageBubble.tsx
│   ├── MessageInput.tsx
│   ├── ChatListItem.tsx
│   ├── TypingIndicator.tsx
│   └── MessageStatus.tsx
├── auth/                        # Auth-specific
│   ├── AuthForm.tsx
│   ├── SocialLoginButtons.tsx
│   └── PasswordStrength.tsx
└── layout/                      # Layout components
    ├── SafeArea.tsx
    ├── Container.tsx
    └── Header.tsx
```

### Component File Structure

```typescript
// MessageBubble.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { Message } from '@/src/types';

// Props interface
export interface MessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  onPress?: (messageId: string) => void;
}

// Component
export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  isOwnMessage,
  onPress,
}) => {
  // Hooks
  const theme = useTheme();
  
  // Event handlers
  const handlePress = () => onPress?.(message.id);
  
  // Render
  return (
    <View 
      style={[
        styles.container,
        isOwnMessage ? styles.ownMessage : styles.receivedMessage,
      ]}
      testID="message-container"
    >
      <Text style={styles.content}>{message.content}</Text>
      <Text style={styles.timestamp}>
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    maxWidth: '80%',
    marginVertical: 4,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF69B4',
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#E5E5EA',
  },
  content: {
    fontSize: 16,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.7,
    alignSelf: 'flex-end',
  },
});
```

## Service Layer

### Service Organization

```
src/services/
├── supabase.ts                   # Supabase client initialization
├── authService.ts                # Auth-related API calls
├── chatService.ts                # Chat-related API calls
├── cryptoService.ts              # Encryption/decryption
└── notificationService.ts        # Push notifications
```

### Service Pattern

```typescript
// src/services/chatService.ts
import { supabase } from './supabase';
import type { Chat, Message } from '@/src/types';

export const chatService = {
  // Fetch all chats for user
  async getUserChats(userId: string): Promise<Chat[]> {
    const { data, error } = await supabase
      .from('chats')
      .select('*')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .order('last_message_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },
  
  // Send message
  async sendMessage(chatId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({ chat_id: chatId, content })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },
  
  // Subscribe to real-time messages
  subscribeToMessages(
    chatId: string,
    callback: (message: Message) => void
  ) {
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => callback(payload.new as Message)
      )
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  },
};
```

## Hook Organization

### Custom Hooks

```
src/hooks/
├── useMessages.ts                # Message-related logic
├── useChatSubscription.ts        # Real-time subscriptions
├── useAuth.ts                    # Authentication state
├── useTypingIndicator.ts         # Typing status
└── usePushNotifications.ts       # Push notification setup
```

### Hook Pattern

```typescript
// src/hooks/useMessages.ts
import { useState, useEffect, useCallback } from 'react';
import { chatService } from '@/src/services/chatService';
import type { Message } from '@/src/types';

interface UseMessagesReturn {
  messages: Message[];
  loading: boolean;
  error: string | null;
  addMessage: (message: Message) => void;
  sendMessage: (content: string) => Promise<void>;
}

export const useMessages = (chatId: string): UseMessagesReturn => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch messages
  useEffect(() => {
    let cancelled = false;
    
    const fetchMessages = async () => {
      try {
        setLoading(true);
        const data = await chatService.getMessages(chatId);
        
        if (!cancelled) {
          setMessages(data);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };
    
    if (chatId) {
      fetchMessages();
    }
    
    return () => {
      cancelled = true;
    };
  }, [chatId]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    if (!chatId) return;
    
    const unsubscribe = chatService.subscribeToMessages(
      chatId,
      (message) => {
        setMessages((prev) => [message, ...prev]);
      }
    );
    
    return unsubscribe;
  }, [chatId]);
  
  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [message, ...prev]);
  }, []);
  
  const sendMessage = useCallback(async (content: string) => {
    await chatService.sendMessage(chatId, content);
  }, [chatId]);
  
  return {
    messages,
    loading,
    error,
    addMessage,
    sendMessage,
  };
};
```

## Type Organization

```
src/types/
├── index.ts                      # Re-export all types
├── user.ts                       # User-related types
├── chat.ts                       # Chat-related types
├── message.ts                    # Message types
└── api.ts                        # API response types
```

### Type Definitions

```typescript
// src/types/message.ts
export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  encrypted_content?: string;
  iv?: string;
  status: MessageStatus;
  media_url?: string;
  media_type?: MediaType;
  created_at: Date;
  updated_at: Date;
}

export type MessageStatus = 
  | 'sending'
  | 'sent'
  | 'delivered'
  | 'read'
  | 'failed';

export type MediaType = 
  | 'image'
  | 'video'
  | 'file'
  | 'audio';
```

## Configuration

```
src/config/
├── theme.ts                      # Theme colors, typography
├── constants.ts                  # App constants
└── env.ts                        # Environment variables
```

### Theme Pattern

```typescript
// src/config/theme.ts
export const theme = {
  colors: {
    primary: '#FF69B4',
    secondary: '#8E8E93',
    background: '#FFFFFF',
    surface: '#F8F9FA',
    error: '#FF3B30',
    success: '#34C759',
    text: '#000000',
    textSecondary: '#8E8E93',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: 'bold' },
    h2: { fontSize: 24, fontWeight: 'bold' },
    body: { fontSize: 16, fontWeight: 'normal' },
    caption: { fontSize: 12, fontWeight: 'normal' },
  },
} as const;

export type Theme = typeof theme;
```

## Migration Checklist

When refactoring to this structure:

- [ ] Move screens to route groups
- [ ] Extract components to appropriate folders
- [ ] Create service layer for API calls
- [ ] Move types to dedicated files
- [ ] Set up theme configuration
- [ ] Update all imports
- [ ] Test all flows still work
- [ ] Remove old files
