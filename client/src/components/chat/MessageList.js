import React, { useMemo, useState, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import groupMessages from '../../utils/groupMessages';
import DateDivider from './DateDivider';
import MessageGroup from './MessageGroup';
import DeleteMessageModal from '../modals/DeleteMessageModal';
import ThreadPanel from './ThreadPanel';
import UnreadDivider from './UnreadDivider';
import useStickyScroll from '../../hooks/useStickyScroll';

const MessageList = ({ messages, currentUser, selectedChat }) => {
  const { deleteMessageById, startReply, markMessageAsRead } = useChat();
  const [messageToDelete, setMessageToDelete] = useState(null);
  const messageRefs = useRef({});

  const scrollToMessage = (id) => {
    const el = messageRefs.current[id];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-blue-400');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-blue-400');
      }, 2000);
    }
  };

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
    jumpToUnread,
  } = useStickyScroll({
    firstUnreadId,
    scrollToMessage,
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

  let lastDate = null;
  let lastMessageDate = null;
  return (
    <div ref={listRef} className="space-y-2 relative">
      {groups.map((group) => {
        const dateStr = group.startAt.toDateString();
        const showDivider = lastDate !== dateStr;
        lastDate = dateStr;
        const containsUnread =
          firstUnreadId && group.items.some((m) => m._id === firstUnreadId);

        if (containsUnread) {
          const index = group.items.findIndex((m) => m._id === firstUnreadId);
          const before = group.items.slice(0, index);
          const after = group.items.slice(index);
          const lastItem = after[after.length - 1];
          lastMessageDate = new Date(lastItem.createdAt);
          return (
            <React.Fragment key={group.key}>
              {showDivider && <DateDivider date={group.startAt} />}
              {before.length > 0 && (
                <MessageGroup
                  group={{ ...group, items: before }}
                  currentUser={currentUser}
                  onDelete={handleDeleteRequest}
                  prevMessageDate={lastMessageDate}
                  registerMessageRef={registerMessageRef}
                  onReply={handleReply}
                  scrollToMessage={scrollToMessage}
                />
              )}
              <UnreadDivider ref={dividerRef} />
              <MessageGroup
                group={{ ...group, items: after }}
                currentUser={currentUser}
                onDelete={handleDeleteRequest}
                prevMessageDate={lastMessageDate}
                registerMessageRef={registerMessageRef}
                onReply={handleReply}
                scrollToMessage={scrollToMessage}
              />
            </React.Fragment>
          );
        }

        const element = (
          <React.Fragment key={group.key}>
            {showDivider && <DateDivider date={group.startAt} />}
            <MessageGroup
              group={group}
              currentUser={currentUser}
              onDelete={handleDeleteRequest}
              prevMessageDate={lastMessageDate}
              registerMessageRef={registerMessageRef}
              onReply={handleReply}
              scrollToMessage={scrollToMessage}
            />
          </React.Fragment>
        );
        const lastItem = group.items[group.items.length - 1];
        lastMessageDate = new Date(lastItem.createdAt);
        return element;
      })}
      {messageToDelete && (
        <DeleteMessageModal
          isOpen={!!messageToDelete}
          onClose={closeModal}
          onDeleteForMe={deleteForMe}
          onDeleteForEveryone={deleteForEveryone}
        />
      )}
      <ThreadPanel />
      <div ref={bottomRef} />
      {showUnreadButton && (
        <button
          onClick={jumpToUnread}
          className="fixed right-4 bottom-24 md:bottom-6 px-4 py-2 rounded-full bg-primary-600 text-white shadow-lg"
        >
          Jump to last unread
        </button>
      )}
    </div>
  );
};

export default MessageList;
