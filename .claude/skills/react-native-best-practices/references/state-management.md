# State Management Patterns with Zustand

## Store Architecture

### Domain-Specific Stores

Separate stores by domain to prevent unnecessary re-renders:

```typescript
// src/store/chatStore.ts
import { create } from 'zustand';

interface ChatState {
  // State
  chats: Chat[];
  selectedChatId: string | null;
  messages: Record<string, Message[]>;
  loading: boolean;
  error: string | null;
  
  // Actions
  setChats: (chats: Chat[]) => void;
  setSelectedChat: (chatId: string | null) => void;
  addMessage: (chatId: string, message: Message) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  selectedChatId: null,
  messages: {},
  loading: false,
  error: null,
  
  setChats: (chats) => set({ chats }),
  setSelectedChat: (chatId) => set({ selectedChatId: chatId }),
  addMessage: (chatId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), message]
    }
  })),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));
```

### User Store

```typescript
// src/store/userStore.ts
interface UserState {
  user: User | null;
  isAuthenticated: boolean;
  profile: UserProfile | null;
  
  setUser: (user: User | null) => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  isAuthenticated: false,
  profile: null,
  
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user 
  }),
  
  updateProfile: (profile) => set((state) => ({
    profile: state.profile ? { ...state.profile, ...profile } : profile
  })),
  
  logout: () => set({ 
    user: null, 
    isAuthenticated: false, 
    profile: null 
  }),
}));
```

### Settings Store with Persistence

```typescript
// src/store/settingsStore.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  soundEnabled: boolean;
  language: string;
  
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  toggleNotifications: () => void;
  toggleSound: () => void;
  setLanguage: (lang: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      notifications: true,
      soundEnabled: true,
      language: 'en',
      
      setTheme: (theme) => set({ theme }),
      toggleNotifications: () => set((s) => ({ 
        notifications: !s.notifications 
      })),
      toggleSound: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
```

## Selector Patterns

### Basic Selectors

```typescript
// ✅ Good: Select only what you need
const chats = useChatStore((state) => state.chats);
const loading = useChatStore((state) => state.loading);

// ✅ Good: Derive data in selector
const selectedChat = useChatStore((state) => 
  state.chats.find(c => c.id === state.selectedChatId)
);

// ✅ Good: Multiple selectors (each triggers independent re-render)
const messages = useChatStore((state) => 
  state.selectedChatId ? state.messages[state.selectedChatId] || [] : []
);
const addMessage = useChatStore((state) => state.addMessage);
```

### Shallow Equality

```typescript
import { useShallow } from 'zustand/react/shallow';

// Prevents re-render when object properties haven't changed
const { chats, loading } = useChatStore(
  useShallow((state) => ({
    chats: state.chats,
    loading: state.loading,
  }))
);
```

### Computed Selectors

```typescript
// Create a custom hook for complex selectors
const useChatMessages = (chatId: string) => {
  return useChatStore((state) => ({
    messages: state.messages[chatId] || [],
    loading: state.loading,
    error: state.error,
  }));
};

// Usage
const { messages, loading, error } = useChatMessages(chatId);
```

## Async Actions

### With Error Handling

```typescript
interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,
  
  login: async (email, password) => {
    set({ loading: true, error: null });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      set({ user: data.user, loading: false });
    } catch (error) {
      set({ 
        error: error.message, 
        loading: false 
      });
      throw error;
    }
  },
  
  register: async (data) => {
    set({ loading: true, error: null });
    
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            display_name: data.displayName,
          },
        },
      });
      
      if (error) throw error;
      
      set({ user: authData.user, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },
  
  logout: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null, error: null });
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },
}));
```

## Real-Time Subscriptions

### Supabase Integration

```typescript
const useRealtimeMessages = (chatId: string) => {
  const addMessage = useChatStore((s) => s.addMessage);
  const updateMessageStatus = useChatStore((s) => s.updateMessageStatus);
  
  useEffect(() => {
    if (!chatId) return;
    
    // Subscribe to new messages
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
        (payload) => {
          addMessage(chatId, payload.new as Message);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          updateMessageStatus(payload.new.id, payload.new.status);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId, addMessage, updateMessageStatus]);
};
```

## Store Testing

```typescript
describe('chatStore', () => {
  it('should add message to correct chat', () => {
    const { addMessage, messages } = useChatStore.getState();
    
    const testMessage = {
      id: 'msg1',
      content: 'Hello',
      senderId: 'user1',
      timestamp: new Date(),
    };
    
    addMessage('chat1', testMessage);
    
    const state = useChatStore.getState();
    expect(state.messages['chat1']).toContainEqual(testMessage);
  });
  
  it('should handle adding message to non-existent chat', () => {
    const { addMessage } = useChatStore.getState();
    
    addMessage('newChat', { id: 'msg1', content: 'Hi', senderId: 'u1' });
    
    const state = useChatStore.getState();
    expect(state.messages['newChat']).toBeDefined();
    expect(state.messages['newChat'].length).toBe(1);
  });
});
```

## Common Patterns

### Optimistic Updates

```typescript
const useOptimisticMessages = (chatId: string) => {
  const addMessage = useChatStore((s) => s.addMessage);
  
  const sendOptimisticMessage = useCallback(async (text: string) => {
    const tempId = `temp_${Date.now()}`;
    
    // Optimistic add
    const optimisticMessage = {
      id: tempId,
      content: text,
      senderId: currentUserId,
      status: 'sending',
      timestamp: new Date(),
    };
    
    addMessage(chatId, optimisticMessage);
    
    try {
      // Send to server
      const { data, error } = await supabase
        .from('messages')
        .insert({ chat_id: chatId, content: text })
        .select()
        .single();
      
      if (error) throw error;
      
      // Replace optimistic with real message
      // (In practice, you'd have an updateMessage action)
    } catch (error) {
      // Remove optimistic message on failure
      // (In practice, you'd have a removeMessage action)
    }
  }, [chatId, addMessage]);
  
  return { sendOptimisticMessage };
};
```

### Debounced Actions

```typescript
import { useDebounce } from 'use-debounce';

const useTypingIndicator = (chatId: string) => {
  const [isTyping, setIsTyping] = useState(false);
  const [debouncedIsTyping] = useDebounce(isTyping, 1000);
  
  useEffect(() => {
    if (debouncedIsTyping) {
      // Send typing indicator to server
      sendTypingStatus(chatId, true);
    }
  }, [debouncedIsTyping, chatId]);
  
  const handleTyping = useCallback(() => {
    setIsTyping(true);
    
    // Reset after 2 seconds of no typing
    setTimeout(() => setIsTyping(false), 2000);
  }, []);
  
  return { handleTyping };
};
```

## Anti-Patterns to Avoid

```typescript
// ❌ Bad: Selecting entire store
const state = useChatStore();

// ❌ Bad: Creating new objects in selector
const chatNames = useChatStore((state) => 
  state.chats.map(c => c.name)  // New array every time
);

// ❌ Bad: Side effects in store
set((state) => {
  api.logEvent('state_changed');  // Don't do this
  return { ...state, value: newValue };
});

// ❌ Bad: Circular dependencies
// Store A imports from Store B, Store B imports from Store A
```
