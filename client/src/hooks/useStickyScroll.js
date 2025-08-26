import { useEffect, useRef, useState } from 'react';

const useStickyScroll = ({ firstUnreadId, scrollToMessage, onReachedLatest, delay = 2000 }) => {
  const listRef = useRef(null);
  const dividerRef = useRef(null);
  const bottomRef = useRef(null);
  const [showUnreadButton, setShowUnreadButton] = useState(Boolean(firstUnreadId));

  useEffect(() => {
    setShowUnreadButton(Boolean(firstUnreadId));
  }, [firstUnreadId]);

  // Observe unread divider visibility
  useEffect(() => {
    const container = listRef.current?.closest('.chat-scroll') || listRef.current;
    if (!container || !dividerRef.current) return;

    const observer = new IntersectionObserver(([entry]) => {
      setShowUnreadButton(!entry.isIntersecting && Boolean(firstUnreadId));
    }, { root: container });

    observer.observe(dividerRef.current);
    return () => observer.disconnect();
  }, [firstUnreadId]);

  // Observe bottom of list to mark as read
  useEffect(() => {
    const container = listRef.current?.closest('.chat-scroll') || listRef.current;
    if (!container || !bottomRef.current) return;
    let timer;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        timer = setTimeout(() => {
          if (onReachedLatest) onReachedLatest();
        }, delay);
      } else if (timer) {
        clearTimeout(timer);
      }
    }, { root: container });
    observer.observe(bottomRef.current);
    return () => {
      observer.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, [onReachedLatest, delay]);

  const jumpToUnread = () => {
    if (firstUnreadId) scrollToMessage(firstUnreadId);
  };

  return { listRef, dividerRef, bottomRef, showUnreadButton, jumpToUnread };
};

export default useStickyScroll;
