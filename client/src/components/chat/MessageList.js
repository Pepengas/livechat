import React, { useMemo, useState, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useChat } from '../../hooks/useChat';
import groupMessages from '../../utils/groupMessages';
import DateDivider from './DateDivider';
import MessageGroup from './MessageGroup';
import DeleteMessageModal from '../modals/DeleteMessageModal';
import ThreadPanel from './ThreadPanel';
import UnreadDivider from './UnreadDivider';
import useStickyScroll from '../../hooks/useStickyScroll';

const MessageList = ({ messages, currentUser, selectedChat, scrollManagerRef }) => {
  const { deleteMessageById, startReply, markMessageAsRead } = useChat();
  const [messageToDelete, setMessageToDelete] = useState(null);
  const messageRefs = useRef({});
  const scrollToMessageRef = useRef(null);

  const firstUnreadId = useMemo(() => {
    const lastReadAt = selectedChat?.lastReadAt
      ? new Date(selectedChat.lastReadAt)
      : null;
    if (!lastReadAt) return null;
    const first = messages.find((m) => new Date(m.createdAt) > lastReadAt);
    return first ? first._id : null;
  }, [messages, selectedChat]);

  const {
    listRef,
    dividerRef,
    bottomRef,
    showUnreadButton,
  } = useStickyScroll({
    firstUnreadId,
    scrollToMessage: (id) => scrollToMessageRef.current?.(id),
    onReachedLatest: () =>
      selectedChat && markMessageAsRead(selectedChat._id),
  });

  const registerMessageRef = (id) => (el) => {
    if (el) {
      messageRefs.current[id] = el;
    }
  };

  const handleReply = (message) => {
    startReply(message);
  };

  const groups = useMemo(() => groupMessages(messages), [messages]);

  const items = useMemo(() => {
    const elements = [];
    let lastDateStr = null;
    let lastMessageDate = null;
    groups.forEach((group) => {
      const dateStr = group.startAt.toDateString();
      if (lastDateStr !== dateStr) {
        elements.push({
          type: 'date',
          key: `date-${group.startAt.getTime()}`,
          date: group.startAt,
        });
        lastDateStr = dateStr;
      }
      const containsUnread =
        firstUnreadId && group.items.some((m) => m._id === firstUnreadId);
      if (containsUnread) {
        const index = group.items.findIndex((m) => m._id === firstUnreadId);
        const before = group.items.slice(0, index);
        const after = group.items.slice(index);
        if (before.length > 0) {
          elements.push({
            type: 'group',
            key: `${group.key}-before`,
            group: { ...group, items: before },
            prevMessageDate: lastMessageDate,
          });
          const lastBefore = before[before.length - 1];
          lastMessageDate = new Date(lastBefore.createdAt);
        }
        elements.push({ type: 'unread', key: 'unread-divider' });
        elements.push({
          type: 'group',
          key: `${group.key}-after`,
          group: { ...group, items: after },
          prevMessageDate: lastMessageDate,
        });
        const lastAfter = after[after.length - 1];
        lastMessageDate = new Date(lastAfter.createdAt);
      } else {
        elements.push({
          type: 'group',
          key: group.key,
          group,
          prevMessageDate: lastMessageDate,
        });
        const lastItem = group.items[group.items.length - 1];
        lastMessageDate = new Date(lastItem.createdAt);
      }
    });
    return elements;
  }, [groups, firstUnreadId]);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => listRef.current?.closest('.chat-scroll'),
    estimateSize: () => 80,
  });

  const scrollToMessage = useCallback(
    (id) => {
      const index = items.findIndex(
        (item) =>
          item.type === 'group' &&
          item.group.items.some((m) => m._id === id)
      );
      if (index !== -1) {
        rowVirtualizer.scrollToIndex(index, { align: 'center' });
        setTimeout(() => {
          const el = messageRefs.current[id];
          if (el) {
            el.classList.add('ring-2', 'ring-blue-400');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-blue-400');
            }, 2000);
          }
        }, 100);
      }
    },
    [items, rowVirtualizer]
  );

  scrollToMessageRef.current = scrollToMessage;

  const handleDeleteRequest = (id) => {
    setMessageToDelete(id);
  };

  const closeModal = () => {
    setMessageToDelete(null);
  };

  const deleteForMe = async () => {
    if (!messageToDelete) return;
    try {
      await deleteMessageById(messageToDelete, selectedChat._id, 'me');
    } catch (err) {
      console.error('Error deleting message for me:', err);
    }
  };

  const deleteForEveryone = async () => {
    if (!messageToDelete) return;
    try {
      await deleteMessageById(messageToDelete, selectedChat._id, 'all');
    } catch (err) {
      console.error('Error deleting message for everyone:', err);
    }
  };

  return (
    <div ref={listRef} className="relative">
      <div
        style={{
          height: rowVirtualizer.getTotalSize(),
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const item = items[virtualRow.index];
          return (
            <div
              key={item.key}
              ref={virtualRow.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              {item.type === 'date' && <DateDivider date={item.date} />}
              {item.type === 'unread' && <UnreadDivider ref={dividerRef} />}
              {item.type === 'group' && (
                <MessageGroup
                  group={item.group}
                  currentUser={currentUser}
                  onDelete={handleDeleteRequest}
                  prevMessageDate={item.prevMessageDate}
                  registerMessageRef={registerMessageRef}
                  onReply={handleReply}
                  scrollToMessage={scrollToMessage}
                />
              )}
            </div>
          );
        })}
        <div
          ref={bottomRef}
          style={{
            position: 'absolute',
            top: rowVirtualizer.getTotalSize(),
            height: 1,
            width: '100%',
          }}
        />
      </div>
      {messageToDelete && (
        <DeleteMessageModal
          isOpen={!!messageToDelete}
          onClose={closeModal}
          onDeleteForMe={deleteForMe}
          onDeleteForEveryone={deleteForEveryone}
        />
      )}
      <ThreadPanel />
      {showUnreadButton && (
        // user must click to jump; no automatic scrolling
        <button
          onClick={() => scrollManagerRef.current.scrollToBottom('smooth')}
          aria-label="Jump to last unread"
          className="fixed right-4 bottom-24 md:bottom-6 p-3 rounded-full bg-primary-600 text-white shadow-lg"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      )}
    </div>
  );
};

export default MessageList;
