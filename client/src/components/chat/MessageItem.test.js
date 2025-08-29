import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageItem from './MessageItem';
import { ChatContext } from '../../contexts/ChatContext';

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
jest.mock('./MessageActionsMenu', () => () => <div />);

describe('MessageItem reply block', () => {
  const renderWithContext = (ui, contextValue) => {
    return render(
      <ChatContext.Provider value={contextValue}>{ui}</ChatContext.Provider>
    );
  };

  it('renders quoted reply and navigates on click', async () => {
    const ensureMessageLoaded = jest.fn().mockResolvedValue(true);
    const scrollToMessage = jest.fn();
    const message = {
      _id: 'm2',
      content: 'Hi',
      createdAt: new Date().toISOString(),
      sender: { _id: 'u1' },
      status: 'sent',
      replyTo: {
        id: 'm1',
        senderId: 'u2',
        senderName: 'Alice',
        excerpt: 'Hello there',
        createdAt: new Date().toISOString(),
      },
    };
    const contextValue = {
      openThread: jest.fn(),
      currentUser: { _id: 'u1' },
      toggleReaction: jest.fn(),
      replyTo: null,
      ensureMessageLoaded,
    };
    renderWithContext(
      <MessageItem
        message={message}
        isOwn={false}
        onDelete={jest.fn()}
        onReply={jest.fn()}
        scrollToMessage={scrollToMessage}
      />,
      contextValue
    );
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Hello there')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Hello there'));
    await waitFor(() => expect(ensureMessageLoaded).toHaveBeenCalledWith('m1'));
    await waitFor(() => expect(scrollToMessage).toHaveBeenCalledWith('m1'));
  });

  it('shows fallback when original message unavailable', () => {
    const message = {
      _id: 'm2',
      content: 'Hi',
      createdAt: new Date().toISOString(),
      sender: { _id: 'u1' },
      status: 'sent',
      replyTo: { id: 'm1', isUnavailable: true },
    };
    const contextValue = {
      openThread: jest.fn(),
      currentUser: { _id: 'u1' },
      toggleReaction: jest.fn(),
      replyTo: null,
      ensureMessageLoaded: jest.fn().mockResolvedValue(false),
    };
    renderWithContext(
      <MessageItem
        message={message}
        isOwn={false}
        onDelete={jest.fn()}
        onReply={jest.fn()}
        scrollToMessage={jest.fn()}
      />,
      contextValue
    );
    expect(
      screen.getByText('Original message unavailable')
    ).toBeInTheDocument();
  });
});
