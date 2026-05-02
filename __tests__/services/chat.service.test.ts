import { chatService } from '@/services/supabase/chat.service';
import { supabase } from '@/services/supabase/config';

jest.mock('@/services/supabase/config', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(),
  },
}));

describe('chatService', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('getUserChats', () => {
    it('should get user chats', async () => {
      const mockChats = [{ id: '1', name: 'Test Chat', participant_ids: ['user-123'] }];
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValue({ data: mockChats, error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      const result = await chatService.getUserChats('user-123');

      expect(supabase.from).toHaveBeenCalledWith('chats');
      expect(mockChain.select).toHaveBeenCalledWith('*');
      expect(mockChain.contains).toHaveBeenCalledWith('participant_ids', ['user-123']);
      expect(result).toEqual(mockChats);
    });

    it('should throw on error', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        then: jest.fn((resolve) => resolve({ data: null, error: { message: 'DB error' } })),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await expect(chatService.getUserChats('user-123')).rejects.toThrow('DB error');
    });
  });

  describe('subscribeToUserChats', () => {
    it('should subscribe to realtime changes', async () => {
      const mockChannel = {
        on: jest.fn().mockReturnThis(),
        subscribe: jest.fn(),
      };
      (supabase.channel as jest.Mock).mockReturnValue(mockChannel);

      const callback = jest.fn();
      chatService.subscribeToUserChats('user-123', callback);

      expect(supabase.channel).toHaveBeenCalledWith('public:chats:participants=user-123');
      expect(mockChannel.on).toHaveBeenCalled();
      expect(mockChannel.subscribe).toHaveBeenCalled();
    });
  });

  describe('updateLastMessage', () => {
    it('should update last message', async () => {
      const mockChain = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);

      await chatService.updateLastMessage('chat-1', 'msg-1');

      expect(mockChain.update).toHaveBeenCalledWith({
        last_message_id: 'msg-1',
        updated_at: expect.any(String),
      });
    });
  });
});
