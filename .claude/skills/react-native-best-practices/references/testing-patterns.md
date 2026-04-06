# Testing Patterns for React Native 2026

## Test Structure

### Directory Organization

```
src/
├── components/
│   ├── MessageBubble.tsx
│   └── MessageBubble.test.tsx
├── services/
│   ├── supabase.ts
│   └── supabase.test.ts
├── hooks/
│   ├── useMessages.ts
│   └── useMessages.test.ts
└── utils/
    ├── crypto.ts
    └── crypto.test.ts

# Or separate __tests__ directory
src/
├── components/
│   └── MessageBubble.tsx
└── __tests__/
    └── components/
        └── MessageBubble.test.tsx
```

## Unit Testing

### Testing Utilities

```typescript
// src/utils/crypto.test.ts
import { encryptMessage, decryptMessage, generateChatKey } from './crypto';

describe('crypto utils', () => {
  describe('encryptMessage', () => {
    it('should encrypt message content', () => {
      const key = generateChatKey();
      const originalText = 'Hello, secret message!';
      
      const encrypted = encryptMessage(originalText, key);
      
      expect(encrypted).not.toBe(originalText);
      expect(encrypted).toBeDefined();
    });
    
    it('should produce different output for same input with different IV', () => {
      const key = generateChatKey();
      const text = 'Test message';
      
      const encrypted1 = encryptMessage(text, key);
      const encrypted2 = encryptMessage(text, key);
      
      // Same content, different IV = different ciphertext
      expect(encrypted1).not.toBe(encrypted2);
    });
  });
  
  describe('decryptMessage', () => {
    it('should decrypt to original text', () => {
      const key = generateChatKey();
      const originalText = 'Secret message';
      
      const encrypted = encryptMessage(originalText, key);
      const decrypted = decryptMessage(encrypted, key);
      
      expect(decrypted).toBe(originalText);
    });
    
    it('should fail with wrong key', () => {
      const key1 = generateChatKey();
      const key2 = generateChatKey();
      const text = 'Secret message';
      
      const encrypted = encryptMessage(text, key1);
      
      expect(() => decryptMessage(encrypted, key2)).toThrow();
    });
  });
});
```

### Testing Hooks

```typescript
// src/hooks/useMessages.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useMessages } from './useMessages';

describe('useMessages hook', () => {
  it('should initialize with empty messages', () => {
    const { result } = renderHook(() => useMessages('chat123'));
    
    expect(result.current.messages).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
  
  it('should fetch messages on mount', async () => {
    const mockMessages = [
      { id: '1', content: 'Hi', timestamp: new Date() },
      { id: '2', content: 'Hello', timestamp: new Date() },
    ];
    
    // Mock Supabase
    jest.spyOn(supabase, 'from').mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: mockMessages, error: null }),
    });
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useMessages('chat123')
    );
    
    expect(result.current.loading).toBe(true);
    
    await waitForNextUpdate();
    
    expect(result.current.messages).toEqual(mockMessages);
    expect(result.current.loading).toBe(false);
  });
  
  it('should add new message to list', () => {
    const { result } = renderHook(() => useMessages('chat123'));
    
    const newMessage = {
      id: '3',
      content: 'New message',
      timestamp: new Date(),
    };
    
    act(() => {
      result.current.addMessage(newMessage);
    });
    
    expect(result.current.messages).toContainEqual(newMessage);
  });
  
  it('should handle fetch error', async () => {
    jest.spyOn(supabase, 'from').mockReturnValue({
      select: jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Failed to fetch' } 
      }),
    });
    
    const { result, waitForNextUpdate } = renderHook(() => 
      useMessages('chat123')
    );
    
    await waitForNextUpdate();
    
    expect(result.current.error).toBe('Failed to fetch');
  });
});
```

## Component Testing

### Basic Component Test

```typescript
// src/components/MessageBubble.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MessageBubble } from './MessageBubble';

describe('MessageBubble', () => {
  const mockMessage = {
    id: 'msg1',
    content: 'Hello, world!',
    senderId: 'user1',
    timestamp: new Date('2026-04-06T10:00:00Z'),
    status: 'delivered' as const,
  };
  
  it('should render message content', () => {
    render(<MessageBubble message={mockMessage} isOwnMessage={true} />);
    
    expect(screen.getByText('Hello, world!')).toBeTruthy();
  });
  
  it('should format timestamp correctly', () => {
    render(<MessageBubble message={mockMessage} isOwnMessage={false} />);
    
    expect(screen.getByText('10:00 AM')).toBeTruthy();
  });
  
  it('should apply own message styles', () => {
    const { getByTestId } = render(
      <MessageBubble message={mockMessage} isOwnMessage={true} />
    );
    
    const container = getByTestId('message-container');
    expect(container.props.style).toMatchObject({
      alignSelf: 'flex-end',
      backgroundColor: '#FF69B4', // Pink for own messages
    });
  });
  
  it('should apply received message styles', () => {
    const { getByTestId } = render(
      <MessageBubble message={mockMessage} isOwnMessage={false} />
    );
    
    const container = getByTestId('message-container');
    expect(container.props.style).toMatchObject({
      alignSelf: 'flex-start',
      backgroundColor: '#E5E5EA', // Gray for received messages
    });
  });
  
  it('should show status indicator for own messages', () => {
    render(<MessageBubble message={mockMessage} isOwnMessage={true} />);
    
    expect(screen.getByTestId('message-status')).toBeTruthy();
  });
  
  it('should not show status indicator for received messages', () => {
    render(<MessageBubble message={mockMessage} isOwnMessage={false} />);
    
    expect(screen.queryByTestId('message-status')).toBeNull();
  });
});
```

### Testing with Providers

```typescript
// Test utilities
import { render } from '@testing-library/react-native';

const customRender = (
  ui: React.ReactElement,
  { store }: { store: any } = {}
) => {
  return render(
    <SafeAreaProvider>
      <ThemeProvider theme={defaultTheme}>
        {store ? (
          <TestStoreProvider store={store}>{ui}</TestStoreProvider>
        ) : (
          ui
        )}
      </ThemeProvider>
    </SafeAreaProvider>,
  );
};

// Usage
it('should render with theme', () => {
  customRender(<ChatList />);
  
  const header = screen.getByTestId('chat-list-header');
  expect(header.props.style.color).toBe(defaultTheme.colors.primary);
});
```

### Testing User Interactions

```typescript
it('should call onSend when send button is pressed', () => {
  const onSend = jest.fn();
  render(<MessageInput onSend={onSend} />);
  
  const input = screen.getByPlaceholderText('Type a message...');
  const sendButton = screen.getByTestId('send-button');
  
  fireEvent.changeText(input, 'Hello!');
  fireEvent.press(sendButton);
  
  expect(onSend).toHaveBeenCalledWith('Hello!');
  expect(onSend).toHaveBeenCalledTimes(1);
});

it('should clear input after sending', () => {
  const onSend = jest.fn();
  render(<MessageInput onSend={onSend} />);
  
  const input = screen.getByPlaceholderText('Type a message...');
  const sendButton = screen.getByTestId('send-button');
  
  fireEvent.changeText(input, 'Test message');
  fireEvent.press(sendButton);
  
  expect(input.props.value).toBe('');
});

it('should disable send button when input is empty', () => {
  render(<MessageInput onSend={jest.fn()} />);
  
  const sendButton = screen.getByTestId('send-button');
  expect(sendButton.props.disabled).toBe(true);
});

it('should enable send button when input has text', () => {
  render(<MessageInput onSend={jest.fn()} />);
  
  const input = screen.getByPlaceholderText('Type a message...');
  const sendButton = screen.getByTestId('send-button');
  
  fireEvent.changeText(input, 'Hello');
  expect(sendButton.props.disabled).toBe(false);
});
```

### Testing FlatList Rendering

```typescript
it('should render all messages', () => {
  const messages = [
    { id: '1', content: 'Message 1', senderId: 'user1' },
    { id: '2', content: 'Message 2', senderId: 'user2' },
    { id: '3', content: 'Message 3', senderId: 'user1' },
  ];
  
  render(<MessageList messages={messages} />);
  
  expect(screen.getByText('Message 1')).toBeTruthy();
  expect(screen.getByText('Message 2')).toBeTruthy();
  expect(screen.getByText('Message 3')).toBeTruthy();
});

it('should show empty state when no messages', () => {
  render(<MessageList messages={[]} />);
  
  expect(screen.getByText('No messages yet')).toBeTruthy();
  expect(screen.getByTestId('empty-state')).toBeTruthy();
});

it('should render messages in correct order', () => {
  const messages = [
    { id: '1', content: 'First', timestamp: new Date('2026-04-06T09:00:00Z') },
    { id: '2', content: 'Second', timestamp: new Date('2026-04-06T10:00:00Z') },
  ];
  
  render(<MessageList messages={messages} />);
  
  const messageElements = screen.getAllByTestId('message-container');
  expect(messageElements[0]).toHaveTextContent('Second'); // Inverted
  expect(messageElements[1]).toHaveTextContent('First');
});
```

## Mocking

### Mocking Supabase

```typescript
// __mocks__/supabase.ts
export const supabase = {
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getUser: jest.fn(),
  },
  from: jest.fn().mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: [], error: null }),
      single: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
    insert: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null }),
    }),
    update: jest.fn().mockReturnValue({
      eq: jest.fn().mockResolvedValue({ data: null, error: null }),
    }),
  }),
  channel: jest.fn().mockReturnValue({
    on: jest.fn().mockReturnValue({
      on: jest.fn().mockReturnValue({
        subscribe: jest.fn(),
      }),
    }),
    subscribe: jest.fn(),
  }),
  removeChannel: jest.fn(),
};

// Usage in test
jest.mock('@/src/services/supabase');

describe('ChatScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should fetch chats on mount', () => {
    const mockChats = [{ id: '1', name: 'Test Chat' }];
    
    supabase.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: mockChats, error: null }),
    });
    
    render(<ChatScreen />);
    
    expect(supabase.from).toHaveBeenCalledWith('chats');
  });
});
```

### Mocking AsyncStorage

```typescript
// Jest config
module.exports = {
  setupFiles: ['./jest.setup.js'],
};

// jest.setup.js
import '@react-native-async-storage/async-storage/jest/async-storage-mock';
```

### Mocking expo-secure-store

```typescript
// __mocks__/expo-secure-store.js
export default {
  getItemAsync: jest.fn().mockResolvedValue('mock-key'),
  setItemAsync: jest.fn().mockResolvedValue(null),
  deleteItemAsync: jest.fn().mockResolvedValue(null),
};
```

## Integration Testing

### Testing Auth Flow

```typescript
describe('Auth Flow', () => {
  it('should login user and store session', async () => {
    const { login } = useAuthStore.getState();
    
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: 'user1', email: 'test@test.com' } },
      error: null,
    });
    
    await login('test@test.com', 'password123');
    
    const { user, isAuthenticated } = useAuthStore.getState();
    
    expect(user).toEqual({ id: 'user1', email: 'test@test.com' });
    expect(isAuthenticated).toBe(true);
  });
  
  it('should handle invalid credentials', async () => {
    const { login } = useAuthStore.getState();
    
    supabase.auth.signInWithPassword.mockResolvedValue({
      data: null,
      error: { message: 'Invalid credentials' },
    });
    
    await expect(login('wrong@test.com', 'wrongpass')).rejects.toThrow();
    
    const { error } = useAuthStore.getState();
    expect(error).toBe('Invalid credentials');
  });
});
```

## Test Configuration

### Jest Setup

```javascript
// jest.config.js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@unimodules|unimodules|sentry-expo|native-base|react-native-svg|@supabase))',
  ],
  setupFilesAfterEnv: ['@testing-library/react-native/extend-expect'],
  setupFiles: ['./jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Testing Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --maxWorkers=2"
  }
}
```
