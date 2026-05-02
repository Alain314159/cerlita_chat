import React from 'react';
import { render, fireEvent, within } from '@testing-library/react-native';
import { MessageBubble } from '../../src/components/chat/MessageBubble';
import { theme } from '../../src/config/theme';
import { Message, MessageStatus } from '../../src/types';

// Mock dependencies
jest.mock('date-fns', () => ({
  format: jest.fn(() => '12:00'),
}));

// Mock react-native-paper components
jest.mock('react-native-paper', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    IconButton: (props: any) => {
      const { icon, iconColor, testID, onPress } = props;
      return (
        <View 
          testID={testID || `icon-button-${icon}`} 
          accessibilityLabel={`icon-${icon}`}
          accessibilityState={{ disabled: false }}
          {...props}
        >
          {onPress && <View onTouchEnd={onPress} testID="press-target" />}
        </View>
      );
    },
  };
});

// Mock child components
jest.mock('../../src/components/chat/ReplyThread', () => ({
  ReplyThread: () => null,
}));

jest.mock('../../src/components/chat/MessageReactions', () => {
  const React = require('react');
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    MessageReactions: ({ reactions, onReactionPress }: any) => (
      <View testID="message-reactions">
        {Object.entries(reactions).map(([emoji, data]: [string, any]) => (
          <TouchableOpacity 
            key={emoji} 
            onPress={() => onReactionPress?.(emoji)}
            testID={`reaction-${emoji}`}
          >
            <Text>{emoji} {data.count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    ),
  };
});

const createMockMessage = (overrides: Partial<Message> = {}): Message => ({
  id: 'msg-123',
  chatId: 'chat-456',
  senderId: 'user-1',
  type: 'text',
  text: 'Hello Test',
  mediaURL: null,
  thumbnailURL: null,
  status: 'sent' as MessageStatus,
  readAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  isEdited: false,
  replyToId: null,
  ...overrides,
});

describe('MessageBubble', () => {
  describe('Read Receipts Logic', () => {
    it('should show a single check for "sent" status', () => {
      const message = createMockMessage({ status: 'sent' });
      const { getByLabelText } = render(
        <MessageBubble message={message} isMyMessage={true} />
      );
      
      const icon = getByLabelText('icon-check');
      expect(icon).toBeTruthy();
    });

    it('should show double check for "delivered" status', () => {
      const message = createMockMessage({ status: 'delivered' });
      const { getByLabelText } = render(
        <MessageBubble message={message} isMyMessage={true} />
      );
      
      const icon = getByLabelText('icon-check-all');
      expect(icon).toBeTruthy();
    });

    it('should show blue double check when readAt is present', () => {
      const message = createMockMessage({ 
        status: 'delivered', 
        readAt: new Date() 
      });
      const { getByLabelText } = render(
        <MessageBubble message={message} isMyMessage={true} />
      );
      
      const icon = getByLabelText('icon-check-all');
      expect(icon.props.iconColor).toBe(theme.colors.tickRead);
    });

    it('should not show status icons for received messages', () => {
      const message = createMockMessage({ status: 'read' });
      const { queryByLabelText } = render(
        <MessageBubble message={message} isMyMessage={false} />
      );
      
      expect(queryByLabelText('icon-check-all')).toBeNull();
      expect(queryByLabelText('icon-check')).toBeNull();
    });
  });

  describe('Reactions Logic', () => {
    it('should render reactions correctly', () => {
      const reactions = {
        '❤️': { count: 5, userReacted: true },
        '👍': { count: 2, userReacted: false },
      };
      const message = createMockMessage();
      
      const { getByTestId, getByText } = render(
        <MessageBubble message={message} isMyMessage={false} reactions={reactions} />
      );
      
      expect(getByTestId('message-reactions')).toBeTruthy();
      expect(getByText('❤️ 5')).toBeTruthy();
      expect(getByText('👍 2')).toBeTruthy();
    });

    it('should call onReactionPress when a reaction is clicked', () => {
      const onReactionPress = jest.fn();
      const reactions = { '❤️': { count: 1, userReacted: false } };
      const message = createMockMessage();
      
      const { getByTestId } = render(
        <MessageBubble 
          message={message} 
          isMyMessage={false} 
          reactions={reactions} 
          onReactionPress={onReactionPress} 
        />
      );
      
      fireEvent.press(getByTestId('reaction-❤️'));
      expect(onReactionPress).toHaveBeenCalledWith('❤️');
    });

    it('should open emoji picker on long press', () => {
      const message = createMockMessage();
      const { getByTestId, getByText } = render(
        <MessageBubble message={message} isMyMessage={true} />
      );
      
      // The touchable opacity around the bubble
      const bubble = getByTestId(`message-${message.id}`).children[0];
      fireEvent(bubble, 'longPress');
      
      // Common reactions should be visible in the modal
      expect(getByText('❤️')).toBeTruthy();
      expect(getByText('👍')).toBeTruthy();
    });

    it('should select emoji from picker and call onReactionPress', () => {
      const onReactionPress = jest.fn();
      const message = createMockMessage();
      const { getByTestId, getByText } = render(
        <MessageBubble message={message} isMyMessage={true} onReactionPress={onReactionPress} />
      );
      
      const bubble = getByTestId(`message-${message.id}`).children[0];
      fireEvent(bubble, 'longPress');
      
      fireEvent.press(getByText('😂'));
      expect(onReactionPress).toHaveBeenCalledWith('😂');
    });
  });

  describe('Text Content', () => {
    it('should sanitize and render text message', () => {
      const message = createMockMessage({ text: 'Normal text' });
      const { getByText } = render(
        <MessageBubble message={message} isMyMessage={true} />
      );
      
      expect(getByText('Normal text')).toBeTruthy();
    });

    it('should show "editado" label if message was edited', () => {
      const message = createMockMessage({ text: 'Hello', isEdited: true });
      const { getByText } = render(
        <MessageBubble message={message} isMyMessage={true} />
      );
      
      expect(getByText(/editado/)).toBeTruthy();
    });
  });
});
