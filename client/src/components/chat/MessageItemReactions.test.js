import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import MessageItem from './MessageItem';

jest.mock('../../hooks/useChat', () => ({
  useChat: () => ({
    openThread: jest.fn(),
    currentUser: { _id: 'u1' },
    toggleReaction: jest.fn(),
    replyTo: null,
  }),
}));

jest.mock('../../contexts/SocketContext', () => {
  const React = require('react');
  return { SocketContext: React.createContext(null) };
});

const createMessage = () => ({
  _id: 'm1',
  text: 'hello',
  createdAt: new Date().toISOString(),
  reactions: [],
});

const setup = () => {
  const message = createMessage();
  const { container } = render(
    <MessageItem message={message} isOwn={false} onDelete={() => {}} onReply={() => {}} />
  );
  return container.firstChild;
};

describe('MessageItem reactions hover', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  test('opens after hover delay', () => {
    const el = setup();
    fireEvent.mouseEnter(el, { clientX: 0, clientY: 0 });
    act(() => {
      jest.advanceTimersByTime(449);
    });
    expect(screen.queryByText('👍')).not.toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.getByText('👍')).toBeInTheDocument();
  });

  test('resets on pointer movement', () => {
    const el = setup();
    fireEvent.mouseEnter(el, { clientX: 0, clientY: 0 });
    act(() => {
      jest.advanceTimersByTime(200);
    });
    fireEvent.mouseMove(el, { clientX: 20, clientY: 0 });
    act(() => {
      jest.advanceTimersByTime(449);
    });
    expect(screen.queryByText('👍')).not.toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(1);
    });
    expect(screen.getByText('👍')).toBeInTheDocument();
  });

  test('cancelled on leave and scroll', () => {
    let el = setup();
    fireEvent.mouseEnter(el, { clientX: 0, clientY: 0 });
    fireEvent.mouseLeave(el);
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.queryByText('👍')).not.toBeInTheDocument();

    el = setup();
    fireEvent.mouseEnter(el, { clientX: 0, clientY: 0 });
    act(() => {
      window.dispatchEvent(new Event('scroll'));
      jest.advanceTimersByTime(500);
    });
    expect(screen.queryByText('👍')).not.toBeInTheDocument();
  });

  test('closes with grace period', () => {
    const el = setup();
    fireEvent.mouseEnter(el, { clientX: 0, clientY: 0 });
    act(() => {
      jest.advanceTimersByTime(450);
    });
    expect(screen.getByText('👍')).toBeInTheDocument();
    fireEvent.mouseLeave(el);
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(screen.getByText('👍')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(screen.queryByText('👍')).not.toBeInTheDocument();
  });

  test('cooldown prevents immediate reopen', () => {
    const el = setup();
    fireEvent.mouseEnter(el, { clientX: 0, clientY: 0 });
    act(() => {
      jest.advanceTimersByTime(450);
    });
    expect(screen.getByText('👍')).toBeInTheDocument();
    fireEvent.mouseLeave(el);
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(screen.queryByText('👍')).not.toBeInTheDocument();
    fireEvent.mouseEnter(el, { clientX: 0, clientY: 0 });
    act(() => {
      jest.advanceTimersByTime(450);
    });
    expect(screen.queryByText('👍')).not.toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(300);
    });
    fireEvent.mouseEnter(el, { clientX: 0, clientY: 0 });
    act(() => {
      jest.advanceTimersByTime(450);
    });
    expect(screen.getByText('👍')).toBeInTheDocument();
  });

  test('does not open when kebab menu is open', () => {
    const el = setup();
    const menuBtn = screen.getByLabelText(/more options/i);
    fireEvent.click(menuBtn);
    fireEvent.mouseEnter(el, { clientX: 0, clientY: 0 });
    act(() => {
      jest.advanceTimersByTime(500);
    });
    expect(screen.queryByText('👍')).not.toBeInTheDocument();
  });
});
