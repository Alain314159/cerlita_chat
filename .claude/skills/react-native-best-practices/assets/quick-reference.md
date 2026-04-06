# React Native 2026 Quick Reference Guide

## Do This ✅ vs Don't Do This ❌

### Components

```typescript
// ✅ DO: Functional components with hooks
const ChatScreen = () => {
  const chats = useChatStore((s) => s.chats);
  return <FlatList data={chats} renderItem={...} />;
};

// ❌ DON'T: Class components
class ChatScreen extends Component {
  render() { ... }
}
```

### Performance

```typescript
// ✅ DO: Memoize expensive components
const MessageBubble = React.memo(({ message }) => <View>...</View>);

// ❌ DON'T: Inline objects in render
<View style={{ padding: 10 }} />  // Creates new object every render

// ✅ DO: Extract styles
const styles = StyleSheet.create({ container: { padding: 10 } });
<View style={styles.container} />
```

### State Management

```typescript
// ✅ DO: Select specific data
const chats = useChatStore((state) => state.chats);

// ❌ DON'T: Select entire store
const state = useChatStore();  // Re-renders on any change

// ✅ DO: Separate stores by domain
const useChatStore = create<ChatState>(...);
const useUserStore = create<UserState>(...);

// ❌ DON'T: One giant store
const useStore = create({ chats, users, messages, settings, ... });
```

### Lists

```typescript
// ✅ DO: Use FlatList with keyExtractor
<FlatList
  data={messages}
  keyExtractor={(item) => item.id}
  renderItem={({ item }) => <Message message={item} />}
  initialNumToRender={15}
  windowSize={10}
/>

// ❌ DON'T: Use .map() for long lists
{messages.map(msg => <Message key={msg.id} message={msg} />)}
```

### Effects

```typescript
// ✅ DO: Cleanup subscriptions
useEffect(() => {
  const subscription = subscribe();
  return () => subscription.unsubscribe();
}, []);

// ✅ DO: Handle async cancellation
useEffect(() => {
  let cancelled = false;
  const fetch = async () => {
    const data = await api.getData();
    if (!cancelled) setData(data);
  };
  fetch();
  return () => { cancelled = true; };
}, []);

// ❌ DON'T: Forget cleanup
useEffect(() => {
  subscribe();  // Memory leak!
}, []);
```

### TypeScript

```typescript
// ✅ DO: Define interfaces
interface User {
  id: string;
  email: string;
  displayName: string;
}

// ❌ DON'T: Use 'any'
const processUser = (user: any) => { ... }

// ✅ DO: Use type guards
function isPremiumUser(user: User): user is PremiumUser {
  return 'subscription' in user;
}

// ✅ DO: Use discriminated unions
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
```

### Navigation

```typescript
// ✅ DO: Typed navigation
router.push({
  pathname: '/(chat)/[chatId]',
  params: { chatId: 'abc123' }
});

// ✅ DO: Use route groups
app/
├── (auth)/login.tsx
├── (chat)/index.tsx
└── (chat)/[chatId].tsx
```

### Security

```typescript
// ✅ DO: Use SecureStore for secrets
await SecureStore.setItemAsync('encryption_key', key);

// ❌ DON'T: Use AsyncStorage for secrets
await AsyncStorage.setItem('encryption_key', key);

// ✅ DO: Validate env vars
if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
  throw new Error('Supabase URL required');
}

// ❌ DON'T: Hardcode secrets
const SUPABASE_URL = 'https://my-project.supabase.co';  // NEVER!
```

## Common Patterns

### Loading State

```typescript
const ChatScreen = () => {
  const { data, loading, error } = useChats();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} onRetry={refetch} />;
  if (data.length === 0) return <EmptyState />;
  
  return <ChatList data={data} />;
};
```

### Error Boundary

```typescript
class ErrorBoundary extends React.Component {
  state = { hasError: false };
  
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }
    return this.children;
  }
}

// Usage
<ErrorBoundary>
  <ChatScreen />
</ErrorBoundary>
```

### Optimistic Update

```typescript
const sendMessage = async (text: string) => {
  // 1. Optimistic add
  const tempId = `temp_${Date.now()}`;
  addMessage({ id: tempId, content: text, status: 'sending' });
  
  try {
    // 2. Send to server
    const message = await api.sendMessage(text);
    
    // 3. Replace with real data
    updateMessage(tempId, message);
  } catch (error) {
    // 4. Handle failure
    updateMessageStatus(tempId, 'failed');
  }
};
```

## File Naming Conventions

- Components: PascalCase (`MessageBubble.tsx`)
- Hooks: camelCase with 'use' prefix (`useMessages.ts`)
- Services: camelCase with 'Service' suffix (`chatService.ts`)
- Types: camelCase (`message.ts`, `user.ts`)
- Tests: Same name + `.test` (`MessageBubble.test.tsx`)

## Import Order

```typescript
// 1. React/React Native
import React from 'react';
import { View, Text } from 'react-native';

// 2. External libraries
import { create } from 'zustand';
import { supabase } from '@/src/services/supabase';

// 3. Internal modules (absolute paths)
import { MessageBubble } from '@/src/components/chat/MessageBubble';
import { useMessages } from '@/src/hooks/useMessages';

// 4. Relative imports
import { formatDate } from './utils';
import type { MessageProps } from './types';
```

## Performance Checklist

- [ ] FlatList for lists (not .map())
- [ ] React.memo for expensive components
- [ ] useMemo for calculations
- [ ] useCallback for functions
- [ ] StyleSheet.create (not inline)
- [ ] No inline objects/arrays
- [ ] Key extractor provided
- [ ] Window size optimized
- [ ] Remove clipped subviews
- [ ] Images optimized/cached
- [ ] Animations use Reanimated (not Animated)

## Testing Checklist

- [ ] Utilities have unit tests
- [ ] Components have render tests
- [ ] Hooks have behavior tests
- [ ] Services are mocked
- [ ] Error cases covered
- [ ] Edge cases tested
- [ ] User interactions tested
- [ ] 80%+ coverage achieved
