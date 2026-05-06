import { SendMessageUseCase, SendMessageDependencies } from '../SendMessage';

describe('SendMessageUseCase (Clean DI)', () => {
  const mockParams = {
    chatId: 'chat-123',
    senderId: 'user-1',
    text: 'Hello World',
    options: { messageType: 'text' as const }
  };

  // En lugar de jest.mock global, creamos mocks locales inyectables
  const mockDeps: SendMessageDependencies = {
    encrypt: jest.fn().mockResolvedValue({ ciphertext: 'encrypted-text' }),
    sendMessage: jest.fn().mockResolvedValue({ id: 'msg-999' }),
    getChatParticipants: jest.fn().mockResolvedValue(['user-1', 'user-2']),
    getUserById: jest.fn().mockImplementation((id) => {
      if (id === 'user-2') return Promise.resolve({ pushToken: 'token-2' });
      return Promise.resolve({ displayName: 'Sender' });
    }),
    sendPushNotification: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should encrypt the message and trigger notifications using DI', async () => {
    const result = await SendMessageUseCase(mockDeps, mockParams);

    expect(result.messageId).toBe('msg-999');
    expect(mockDeps.encrypt).toHaveBeenCalledWith('Hello World', 'chat-123');
    expect(mockDeps.sendMessage).toHaveBeenCalled();

    // Verify notification
    await result.notificationPromise;
    expect(mockDeps.sendPushNotification).toHaveBeenCalled();
  });
});
