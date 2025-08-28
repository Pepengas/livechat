import React, { useMemo, useState, useRef, useEffect, useCallback } from 'react';
import { VariableSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useChat } from '../../hooks/useChat';
import groupMessages from '../../utils/groupMessages';
import DateDivider from './DateDivider';
import MessageGroup from './MessageGroup';
import DeleteMessageModal from '../modals/DeleteMessageModal';
import ThreadPanel from './ThreadPanel';
import UnreadDivider from './UnreadDivider';
import TypingIndicator from './TypingIndicator';

const Outer = React.forwardRef((props, ref) => (
  <div ref={ref} className="chat-scroll" {...props} />
));

const Inner = React.forwardRef((props, ref) => (
  <div ref={ref} className="chat-column" {...props} />
));

const MessageList = ({ messages, currentUser, selectedChat, scrollManagerRef, typingText }) => {
  const { deleteMessageById, startReply, loadOlderMessages, messagePageInfo } = useChat();
  const [messageToDelete, setMessageToDelete] = useState(null);
  const messageRefs = useRef({});
  const listRef = useRef();
  const outerRef = useRef();
  const sizeMap = useRef({});
  const messageRowMap = useRef({});
  const [highlightId, setHighlightId] = useState(null);
  const [scrollTarget, setScrollTarget] = useState(null);

  useEffect(() => {
    const mgr = scrollManagerRef.current;
    if (outerRef.current) mgr.attach(outerRef.current);
    return () => mgr.detach();
  }, [scrollManagerRef, selectedChat?._id]);

  const firstUnreadId = useMemo(() => {
    const lastReadAt = selectedChat?.lastReadAt ? new Date(selectedChat.lastReadAt) : null;
    if (!lastReadAt) return null;
    const first = messages.find((m) => new Date(m.createdAt) > lastReadAt);
    return first ? first._id : null;
  }, [messages, selectedChat]);

  const registerMessageRef = (id) => (el) => {
    if (el) {
      messageRefs.current[id] = el;
    }
  };

  const handleReply = (message) => {
    startReply(message);
  };

  const rows = useMemo(() => {
    const groups = groupMessages(messages);
    const rows = [];
    const map = {};
    let lastDate = null;
    groups.forEach((group) => {
      const dateStr = group.startAt.toDateString();
      const showDivider = lastDate !== dateStr;
      lastDate = dateStr;
      const containsUnread = firstUnreadId && group.items.some((m) => m._id === firstUnreadId);
      if (showDivider) rows.push({ type: 'date', date: group.startAt });
      if (containsUnread) {
        const index = group.items.findIndex((m) => m._id === firstUnreadId);
        const before = group.items.slice(0, index);
        const after = group.items.slice(index);
        if (before.length > 0) {
          rows.push({ type: 'group', group: { ...group, items: before } });
          before.forEach((m) => (map[m._id] = rows.length - 1));
        }
        rows.push({ type: 'unread' });
        rows.push({ type: 'group', group: { ...group, items: after } });
        after.forEach((m) => (map[m._id] = rows.length - 1));
      } else {
        rows.push({ type: 'group', group });
        group.items.forEach((m) => (map[m._id] = rows.length - 1));
      }
    });
    if (typingText) rows.push({ type: 'typing', text: typingText });
    messageRowMap.current = map;
    return rows;
  }, [messages, firstUnreadId, typingText]);

// Reset cached sizes whenever the row structure changes
  useEffect(() => {
    sizeMap.current = {};
    listRef.current?.resetAfterIndex(0, true);
  }, [rows]);

  const getSize = (index) => sizeMap.current[index] || 80;
  const setSize = (index, size) => {
    if (sizeMap.current[index] !== size) {
      sizeMap.current[index] = size;
      listRef.current?.resetAfterIndex(index);
    }
  };

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

const itemKey = useCallback(
    (index) => {
      const row = rows[index];
      if (row.type === 'date') return `date-${row.date.toISOString()}`;
      if (row.type === 'unread') return 'unread';
      if (row.type === 'typing') return 'typing';
      if (row.type === 'group') return `group-${row.group.items[0]?._id}`;
      return index;
    },
    [rows]
  );

  const scrollToMessage = (id) => {
    const index = messageRowMap.current[id];
    if (index != null) {
      setScrollTarget(id);
      listRef.current.scrollToItem(index, 'start');
      setHighlightId(id);
      setTimeout(() => setHighlightId(null), 2000);
    }
  };

  useEffect(() => {
    if (scrollTarget && messageRefs.current[scrollTarget]) {
      messageRefs.current[scrollTarget].scrollIntoView({ behavior: 'smooth', block: 'center' });
      setScrollTarget(null);
    }
  }, [scrollTarget, rows]);

  const handleScroll = ({ scrollOffset }) => {
    if (scrollOffset === 0 && messagePageInfo[selectedChat._id]?.hasMore) {
      const el = outerRef.current;
      const prev = el.scrollHeight;
      loadOlderMessages(selectedChat._id).then(() => {
        requestAnimationFrame(() => {
          const diff = el.scrollHeight - prev;
          el.scrollTop = diff;
        });
      });
    }
  };

  const Row = ({ index, style }) => {
    const row = rows[index];
    const ref = useCallback((node) => {
      if (node) {
        const h = node.getBoundingClientRect().height;
        setSize(index, h);
      }
    }, [index]);
    if (row.type === 'date') {
      return (
        <div style={style} ref={ref}>
          <DateDivider date={row.date} />
        </div>
      );
    }
    if (row.type === 'unread') {
      return (
        <div style={style} ref={ref}>
          <UnreadDivider />
        </div>
      );
    }
    if (row.type === 'typing') {
      return (
        <div style={style} ref={ref}>
          <TypingIndicator text={row.text} />
        </div>
      );
    }
    return (
      <div style={style} ref={ref}>
        <MessageGroup
          group={row.group}
          currentUser={currentUser}
          onDelete={handleDeleteRequest}
          prevMessageDate={null}
          registerMessageRef={registerMessageRef}
          onReply={handleReply}
          highlightId={highlightId}
        />
      </div>
    );
  };

  return (
    <>
      <AutoSizer>
        {({ height, width }) => (
          <VariableSizeList
            height={height}
            width={width}
            itemCount={rows.length}
            itemSize={getSize}
            estimatedItemSize={80}
            ref={listRef}
            onScroll={handleScroll}
            itemKey={itemKey}
            outerElementType={Outer}
            innerElementType={Inner}
            outerRef={outerRef}
          >
            {Row}
          </VariableSizeList>
        )}
      </AutoSizer>
      {messageToDelete && (
        <DeleteMessageModal
          isOpen={!!messageToDelete}
          onClose={closeModal}
          onDeleteForMe={deleteForMe}
          onDeleteForEveryone={deleteForEveryone}
        />
      )}
      <ThreadPanel />
    </>
  );
};

export default MessageList;
