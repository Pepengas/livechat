import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { ChatProvider, ChatContext } from './ChatContext';
import { AuthContext } from './AuthContext';
import { SocketContext } from './SocketContext';
import * as messageService from '../services/messageService';

jest.mock('../services/messageService');
jest.mock('axios', () => ({
  create: () => ({
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  }),
}));
jest.mock('@floating-ui/react-dom', () => ({
  useFloating: () => ({ x: 0, y: 0, reference: jest.fn(), floating: jest.fn(), strategy: 'absolute', middlewareData: {} }),
  offset: () => {},
  flip: () => {},
  shift: () => {},
  arrow: () => {},
}));

describe('ChatContext reply hydration', () => {
  it('hydrates reply data when missing', async () => {
    const msg = {
      _id: 'm2',
      chat: { _id: 'c1' },
      sender: { _id: 'u1', name: 'Bob' },
      createdAt: new Date().toISOString(),
      replyTo: { id: 'm1' },
    };
    messageService.getMessages.mockResolvedValue({ items: [msg], hasMore: false, nextCursor: null });
    messageService.getMessageById.mockResolvedValue({
      _id: 'm1',
      sender: { _id: 'u2', name: 'Alice' },
      content: 'hello',
      createdAt: new Date().toISOString(),
      attachments: [],
    });
    const wrapper = ({ children }) => (
      <AuthContext.Provider value={{ currentUser: { _id: 'u1' }, isAuthenticated: true }}>
        <SocketContext.Provider value={{ socket: null }}>
          <ChatProvider>{children}</ChatProvider>
        </SocketContext.Provider>
      </AuthContext.Provider>
    );
    const { result } = renderHook(() => React.useContext(ChatContext), { wrapper });
    await act(async () => {
      await result.current.fetchMessages('c1');
    });
    const hydrated = result.current.messages[0].replyTo;
    expect(hydrated.senderName).toBe('Alice');
    expect(hydrated.excerpt).toBe('hello');
    expect(messageService.getMessageById).toHaveBeenCalledWith('m1');
  });
});
