import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { MessageInput } from '@/components/chat/MessageInput';

describe('MessageInput', () => {
  it('renders text input with placeholder', () => {
    const { getByPlaceholderText } = render(
      <MessageInput value="" onChangeText={() => {}} onSend={() => {}} />
    );
    expect(getByPlaceholderText('Escribe un mensaje...')).toBeTruthy();
  });

  it('shows send button when text is entered', () => {
    const { getByTestId } = render(
      <MessageInput value="Hello" onChangeText={() => {}} onSend={() => {}} />
    );
    expect(getByTestId('send-button')).toBeTruthy();
  });

  it('shows camera and mic buttons when input is empty', () => {
    const { getByTestId } = render(
      <MessageInput value="" onChangeText={() => {}} onSend={() => {}} />
    );
    expect(getByTestId('camera-button')).toBeTruthy();
    expect(getByTestId('voice-button')).toBeTruthy();
  });

  it('calls onSend when send button is pressed', () => {
    const onSend = jest.fn();
    const { getByTestId } = render(
      <MessageInput value="Hello" onChangeText={() => {}} onSend={onSend} />
    );
    fireEvent.press(getByTestId('send-button'));
    expect(onSend).toHaveBeenCalled();
  });

  it('calls onAttachmentPress when attachment button is pressed', () => {
    const onAttachmentPress = jest.fn();
    const { getByTestId } = render(
      <MessageInput value="" onChangeText={() => {}} onSend={() => {}} onAttachmentPress={onAttachmentPress} />
    );
    fireEvent.press(getByTestId('attachment-button'));
    expect(onAttachmentPress).toHaveBeenCalled();
  });

  it('disables send button when disabled prop is true', () => {
    const { getByTestId } = render(
      <MessageInput value="Hello" onChangeText={() => {}} onSend={() => {}} disabled />
    );
    const sendButton = getByTestId('send-button');
    expect(sendButton.props.accessibilityState.disabled).toBe(true);
  });

  it('supports custom placeholder', () => {
    const { getByPlaceholderText } = render(
      <MessageInput value="" onChangeText={() => {}} onSend={() => {}} placeholder="Type here..." />
    );
    expect(getByPlaceholderText('Type here...')).toBeTruthy();
  });
});
