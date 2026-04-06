---
name: react-native-best-practices
description: >
  React Native 2026 best practices for Expo SDK 52+ projects with TypeScript, Zustand, Expo Router, and Supabase.
  This skill should be used when writing, reviewing, or refactoring React Native code to ensure modern patterns
  including performance optimization, proper architecture, security, testing, and deployment. Apply when creating
  components, hooks, stores, services, or reviewing PRs for Cerlita Chat or similar Expo-based projects.
context: inline
---

# React Native 2026 Best Practices

## Core Principles

When working on React Native projects in 2026, always apply these principles:

1. **Feature-based organization** - Organize by feature, not by file type
2. **Single responsibility** - Each component has one job
3. **Business logic isolation** - Keep logic out of UI components
4. **Centralized services** - API/service layers in one place
5. **TypeScript-first** - Strict types, no `any`

## Project Structure

### Recommended Structure (Feature-Based)

```
cerlita-chat/
├── app/                      # Expo Router (screens only)
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── ui/              # Base components (Button, Input, Avatar)
│   │   ├── chat/            # Chat-specific components
│   │   └── auth/            # Auth-specific components
│   ├── features/            # Feature modules (preferred)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   └── services/
│   │   └── chat/
│   │       ├── components/
│   │       ├── hooks/
│   │       └── services/
│   ├── hooks/               # Shared custom hooks
│   ├── services/            # Global services (Supabase, Crypto)
│   ├── store/               # Zustand stores
│   ├── types/               # TypeScript types
│   ├── config/              # Theme, environment variables
│   └── utils/               # Helper functions
```

### Key Rules
- Screens in `app/` should be thin wrappers
- Business logic in `src/features/` or `src/services/`
- Reusable components in `src/components/`
- Shared state in `src/store/`

## Performance Optimization

### Virtualized Lists (Critical for Chat)

Always use FlatList/SectionList for scrollable data:

```typescript
<FlatList
  data={messages}
  renderItem={({ item }) => <MessageBubble message={item} />}
  keyExtractor={(item) => item.id}
  initialNumToRender={20}
  maxToRenderPerBatch={10}
  windowSize={10}
  removeClippedSubviews={true}
  inverted={true}
/>
```

**Performance props to always consider:**
- `initialNumToRender`: 10-20
- `maxToRenderPerBatch`: 5-10
- `windowSize`: 5-15
- `removeClippedSubviews`: true for long lists
- `keyExtractor`: always provide

### Memoization Strategy

```typescript
// Use React.memo for expensive components
const MessageBubble = React.memo(({ message }: MessageProps) => {
  return <View>...</View>;
});

// Use useMemo for expensive computations
const sortedMessages = useMemo(() => 
  messages.sort((a, b) => b.timestamp - a.timestamp),
  [messages]
);

// Use useCallback for stable references
const handleSend = useCallback((text: string) => {
  sendMessage(text);
}, [sendMessage]);
```

**When to memoize:**
- Components that re-render often with same props
- Expensive calculations or transformations
- Functions passed as props to memoized children

**When NOT to memoize:**
- Simple components (Text, View wrappers)
- Components that always receive different props
- Premature optimization without profiling

### Style Performance

```typescript
// ✅ Good: StyleSheet.create
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  message: { padding: 12, borderRadius: 12 },
});

// ❌ Bad: Inline objects
<Component style={{ padding: 10 }} />  // Creates new object every render
```

### Avoid Common Performance Pitfalls

```typescript
// ❌ Bad: Spreading in render
const newMessages = [...messages, newMessage];

// ✅ Good: Zustand handles immutability
addMessage: (chatId, message) => set((state) => ({
  messages: {
    ...state.messages,
    [chatId]: [...(state.messages[chatId] || []), message]
  }
}))
```

## State Management (Zustand)

### Store Design

```typescript
// Separate stores by domain
interface ChatState {
  chats: Chat[];
  selectedChat: Chat | null;
  messages: Record<string, Message[]>;
  
  setChats: (chats: Chat[]) => void;
  addMessage: (chatId: string, message: Message) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chats: [],
  selectedChat: null,
  messages: {},
  
  setChats: (chats) => set({ chats }),
  addMessage: (chatId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), message]
    }
  }))
}));
```

### Selector Best Practices

```typescript
// ✅ Good: Select only what you need
const chats = useChatStore((state) => state.chats);
const addMessage = useChatStore((state) => state.addMessage);

// ✅ Good: Multiple selectors for different data
const selectedChatId = useChatStore((s) => s.selectedChat?.id);
const messages = useChatStore((s) => s.messages[selectedChatId] || []);

// ❌ Bad: Selecting entire state
const state = useChatStore();  // Causes unnecessary re-renders
```

### When to Use What

| State Type | Solution | Examples |
|------------|----------|----------|
| Global state | Zustand | User, settings, active chat |
| Local state | useState | Form inputs, modal visibility |
| URL state | Expo Router | Filters, navigation params |
| Server state | Sup realtime | Messages, presence, chat list |
| Persisted state | Zustand + persist | Theme, preferences |

## TypeScript Patterns

### Strict Types

```typescript
// Define interfaces explicitly
interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  lastSeen: Date;
  isOnline: boolean;
}

// Use discriminated unions
type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read' | 'failed';

// Generic types for API responses
interface ApiResponse<T> {
  data: T;
  error: string | null;
  status: number;
}
```

### Avoid `any`

```typescript
// ❌ Bad
const processMessage = (msg: any) => { ... }

// ✅ Good
const processMessage = (msg: Message): EncryptedMessage => { ... }
```

### Type Guards

```typescript
function isEncryptedMessage(msg: Message): msg is EncryptedMessage {
  return 'encryptedContent' in msg;
}
```

## Component Architecture

### Functional Components + Hooks

```typescript
// ✅ Modern pattern
const ChatScreen = () => {
  const { chatId } = useLocalSearchParams();
  const messages = useChatStore((s) => s.messages[chatId]);
  
  useEffect(() => {
    // Subscribe to real-time updates
    const subscription = subscribeToMessages(chatId);
    return () => subscription.unsubscribe();
  }, [chatId]);
  
  return <FlatList data={messages} renderItem={...} />;
};
```

### Component Guidelines

- Functional components only (no classes)
- Custom hooks for reusable logic
- Props interfaces for all components
- Default props with destructuring
- Error boundaries for resilience

### Error Boundaries

```typescript
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  
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
```

## Navigation (Expo Router)

### File-Based Routing

```
app/
├── _layout.tsx              # Root layout with providers
├── (auth)/
│   ├── _layout.tsx         # Auth group layout
│   ├── login.tsx
│   ├── register.tsx
│   └── forgot-password.tsx
└── (chat)/
    ├── _layout.tsx         # Chat group layout (with tabs/nav)
    ├── index.tsx           # Chat list
    └── [chatId].tsx        # Individual chat
```

### Navigation Patterns

```typescript
// Typed navigation
import { router } from 'expo-router';

router.push({
  pathname: '/(chat)/[chatId]',
  params: { chatId: 'abc123' }
});

// Stack screen options
<Stack.Screen 
  options={{
    title: chatName,
    headerBackTitle: 'Chats',
    headerShown: true,
  }} 
/>
```

## Security Best Practices

### Sensitive Data

```typescript
// ✅ Use expo-secure-store
import * as SecureStore from 'expo-secure-store';

// Store encryption keys securely
await SecureStore.setItemAsync(`chat_key_${chatId}`, encryptedKey);

// ❌ Never use AsyncStorage for secrets
// ❌ Never log sensitive data
console.log(apiKey);  // NEVER DO THIS
```

### Environment Variables

```typescript
// ✅ Use EXPO_PUBLIC_ prefix
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;

// ✅ Validate on startup
if (!supabaseUrl) {
  throw new Error('Supabase URL is required');
}
```

### Row Level Security (Supabase)

All tables must have RLS policies:
- Users see only their own profile
- Users see only chats they're members of
- Users see only messages from their chats

## Testing Strategy

### Test Structure

```typescript
// Unit tests (Jest)
describe('encryptMessage', () => {
  it('should encrypt message content', () => {
    const encrypted = encryptMessage('Hello', chatKey);
    expect(encrypted).not.toBe('Hello');
    expect(decryptMessage(encrypted, chatKey)).toBe('Hello');
  });
});

// Component tests (@testing-library/react-native)
test('displays message content', () => {
  render(<MessageBubble message={testMessage} />);
  expect(screen.getByText('Hello')).toBeTruthy();
});
```

### Test Coverage Goals

- Unit tests: 80%+ coverage
- Component tests: All user-facing components
- Integration tests: Critical flows (auth, chat)
- E2E tests: Core user journeys

## Responsive Design

```typescript
// Use Dimensions API
const { width } = useWindowDimensions();
const isTablet = width >= 768;

// Flexbox for layouts
<View style={{ 
  flex: 1, 
  flexDirection: isTablet ? 'row' : 'column' 
}}>
```

## Deployment

### EAS Build

```json
// eas.json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

### OTA Updates

```bash
# Push JS-only updates instantly
eas update --branch production --message "Fix message encryption bug"
```

**OTA can update:**
- JavaScript/TypeScript code
- Assets (images, fonts)
- Configuration

**OTA cannot update:**
- Native code changes
- New permissions
- SDK version changes

## Development Workflow

### Essential Commands

```bash
# Start with cache clear (when issues arise)
npm start -- --clear

# Run on specific platform
npm run android
npm run ios

# Lint code
npm run lint

# Run tests
npm test
```

### Debugging Tools

- React DevTools: `npx react-devtools`
- Flipper: Network, logs, performance
- Hermes Inspector: Memory, JS performance
- Expo DevTools: `localhost:19002`

## Code Review Checklist

When reviewing code, check for:

- [ ] TypeScript types defined (no `any`)
- [ ] Components memoized if needed
- [ ] FlatList used for scrollable data
- [ ] Styles extracted (no inline objects)
- [ ] Error handling present
- [ ] Loading states implemented
- [ ] Accessibility considered
- [ ] Security best practices followed
- [ ] Tests written/updated
- [ ] No console.log in production code

## Resources

For detailed patterns and examples, see:
- [references/performance-patterns.md](references/performance-patterns.md)
- [references/state-management.md](references/state-management.md)
- [references/testing-patterns.md](references/testing-patterns.md)
- [references/project-structure.md](references/project-structure.md)
