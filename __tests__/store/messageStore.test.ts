import { useMessageStore } from '@/store/messageStore';
import { messageService } from '@/services/supabase/message.service';

jest.mock('@/services/supabase/message.service');

describe('messageStore', () => {
  beforeEach(() => {
    useMessageStore.setState({
      messages: [],
      loading: false,
      error: null,
      currentUserId: null,
      subscription: null,
      typingUsers: {},
    });
    jest.clearAllMocks();
  });

  it('should set messages', () => {
    const mockMessages: any[] = [{ id: '1', text: 'Hello' }];
    useMessageStore.getState().setMessages(mockMessages);
    expect(useMessageStore.getState().messages).toEqual(mockMessages);
  });

  it('should add a message if it does not exist', () => {
    const msg = { id: '1', text: 'New' } as any;
    useMessageStore.getState().addMessage(msg);
    expect(useMessageStore.getState().messages).toContainEqual(msg);
  });

  it('should not add duplicate messages', () => {
    const msg = { id: '1', text: 'New' } as any;
    useMessageStore.getState().setMessages([msg]);
    useMessageStore.getState().addMessage(msg);
    expect(useMessageStore.getState().messages.length).toBe(1);
  });

  it('should unsubscribe from messages', () => {
    const mockUnsub = jest.fn();
    useMessageStore.setState({
      subscription: { unsubscribe: mockUnsub } as any,
    });
    
    useMessageStore.getState().unsubscribeFromMessages();
    
    expect(mockUnsub).toHaveBeenCalled();
    expect(useMessageStore.getState().subscription).toBe(null);
  });
});
