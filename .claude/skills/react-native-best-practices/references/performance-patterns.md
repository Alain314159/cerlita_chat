# Performance Patterns for React Native 2026

## FlatList Optimization

### Chat Messages (Inverted List)

```typescript
import { FlatList, View, Text } from 'react-native';
import React, { useMemo, useCallback } from 'react';

const MessageList = React.memo(({ messages, chatId }) => {
  // Memoize keyExtractor to prevent unnecessary re-renders
  const keyExtractor = useCallback((item) => item.id, []);
  
  // Memoize renderItem to prevent recreating on every render
  const renderItem = useCallback(({ item }) => (
    <MessageBubble 
      message={item} 
      isOwnMessage={item.senderId === chatId}
    />
  ), [chatId]);
  
  // Performance props for smooth scrolling
  const getItemLayout = useCallback((data, index) => ({
    length: 60, // Average message height
    offset: 60 * index,
    index,
  }), []);
  
  return (
    <FlatList
      data={messages}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      inverted={true}
      initialNumToRender={15}
      maxToRenderPerBatch={10}
      windowSize={11}
      removeClippedSubviews={true}
      updateCellsBatchingPeriod={100}
      getItemLayout={getItemLayout}
      maintainVisibleContentPosition={{
        minIndexForVisible: 0,
      }}
      ListEmptyComponent={<EmptyMessages />}
      ListFooterComponent={messages.length > 0 ? <ChatFooter /> : null}
    />
  );
});

export default MessageList;
```

### FlashList (Alternative)

For even better performance, consider FlashList from Shopify:

```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={messages}
  renderItem={({ item }) => <MessageBubble message={item} />}
  estimatedItemSize={60}
  inverted
/>
```

## Memoization Patterns

### When to Use React.memo

```typescript
// ✅ Good: Complex component that re-renders often
const MessageBubble = React.memo(({ message, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(message.id)}>
      <Text>{message.content}</Text>
      <Text>{formatTime(message.timestamp)}</Text>
    </TouchableOpacity>
  );
});

// ❌ Bad: Simple component that changes every time
const Timestamp = React.memo(({ time }) => {
  return <Text>{formatTime(time)}</Text>;
});
// Unnecessary - time changes every render anyway
```

### useMemo for Expensive Operations

```typescript
const ChatList = ({ chats, searchTerm }) => {
  // Memoize filtered list
  const filteredChats = useMemo(() => {
    if (!searchTerm) return chats;
    
    return chats.filter(chat => 
      chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [chats, searchTerm]);
  
  // Memoize sorted list
  const sortedChats = useMemo(() => {
    return [...filteredChats].sort((a, b) => 
      b.lastMessageAt - a.lastMessageAt
    );
  }, [filteredChats]);
  
  return <FlatList data={sortedChats} renderItem={...} />;
};
```

### useCallback for Event Handlers

```typescript
const ChatScreen = () => {
  const sendMessage = useChatStore((s) => s.sendMessage);
  
  // Stable reference prevents child re-renders
  const handleSend = useCallback((text: string) => {
    sendMessage(text);
  }, [sendMessage]);
  
  const handleNavigateBack = useCallback(() => {
    router.back();
  }, []);
  
  return (
    <View>
      <MessageInput onSend={handleSend} />
      <Header onBack={handleNavigateBack} />
    </View>
  );
};
```

## Render Performance

### Avoid Inline Objects

```typescript
// ❌ Bad: Creates new object every render
<View style={{ flex: 1, padding: 10, backgroundColor: '#fff' }} />

// ✅ Good: StyleSheet.create
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#fff',
  },
});

<View style={styles.container} />
```

### Conditional Rendering

```typescript
// ✅ Good: Short-circuit with numbers
{count > 0 && <Badge count={count} />}

// ❌ Bad: Renders 0 when count is 0
{count && <Badge count={count} />}
```

## Image Optimization

```typescript
// Use Expo Image for better performance
import { Image } from 'expo-image';

<Image
  source={{ uri: avatarUrl }}
  style={styles.avatar}
  contentFit="cover"
  cachePolicy="memory-disk"
  placeholder={blurhash}
  transition={200}
/>
```

## Animation Performance

### Use Reanimated for Complex Animations

```typescript
import Animated, { 
  useSharedValue, 
  useAnimatedStyle,
  withTiming 
} from 'react-native-reanimated';

const AnimatedCard = () => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  
  useEffect(() => {
    opacity.value = withTiming(1, { duration: 300 });
    translateY.value = withTiming(0, { duration: 300 });
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
  
  return <Animated.View style={animatedStyle}>...</Animated.View>;
};
```

## Memory Management

### Cleanup Subscriptions

```typescript
useEffect(() => {
  // Subscribe to real-time updates
  const subscription = supabase
    .channel(`chat:${chatId}`)
    .on('presence', { event: 'sync' }, handlePresenceChange)
    .subscribe();
  
  // Always cleanup
  return () => {
    subscription.unsubscribe();
  };
}, [chatId]);
```

### Avoid Memory Leaks

```typescript
// ❌ Bad: Async operation without cleanup
useEffect(() => {
  const fetchData = async () => {
    const data = await api.fetchMessages();
    setMessages(data);  // May run after unmount
  };
  
  fetchData();
}, []);

// ✅ Good: With cancellation
useEffect(() => {
  let cancelled = false;
  
  const fetchData = async () => {
    const data = await api.fetchMessages();
    if (!cancelled) {
      setMessages(data);
    }
  };
  
  fetchData();
  
  return () => {
    cancelled = true;
  };
}, []);
```

## Bundle Size Optimization

### Tree Shaking

```typescript
// ✅ Import only what you need
import { supabase } from '@/src/services/supabase';

// ❌ Import entire library
import * as Supabase from '@supabase/supabase-js';
```

### Lazy Loading Screens

```typescript
// Expo Router handles this automatically with file-based routing
// Just ensure heavy components are lazily loaded
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

<Suspense fallback={<LoadingSpinner />}>
  <HeavyComponent />
</Suspense>
```

## Profiling

### Performance Monitor

```typescript
// Enable in development
import { PerformanceMonitor } from 'expo-dev-client';

<PerformanceMonitor />
```

### Key Metrics to Watch

- **FPS**: Should stay at 60fps (or 120 on ProMotion)
- **Memory**: Watch for steady growth (indicates leaks)
- **Render count**: Components shouldn't render unnecessarily
- **JS thread**: Shouldn't block for >100ms
