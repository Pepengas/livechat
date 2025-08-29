import React from 'react';
import { format } from 'date-fns';
import { SocketContext } from '../../contexts/SocketContext';
import { useChat } from '../../hooks/useChat';
import linkify, { extractUrls } from '../../utils/linkify';
import LinkPreviewCard from './LinkPreviewCard';
import ReactionBar from './ReactionBar';
import ReactionChips from './ReactionChips';
import MessageActionsMenu from './MessageActionsMenu';
import MessageStatusTicks from './MessageStatusTicks';

const previewCache = {};

const fetchLinkPreview = async (url) => {
  try {
    const res = await fetch(`/api/link-preview?url=${encodeURIComponent(url)}`);
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (e) {
    // ignore
  }
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve({
          url,
          title: url,
          description: 'Preview not available',
          image: '',
          siteName: new URL(url).hostname,
        }),
      300,
    ),
  );
};

const MessageItem = React.forwardRef(({ message, isOwn, onDelete, onReply }, ref) => {
  const { openThread, currentUser, toggleReaction } = useChat();
  const socket = React.useContext(SocketContext);
  const containerRef = React.useRef(null);
  const setRefs = (el) => {
    containerRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };
  const hasUser = (arr, id) => Array.isArray(arr) && arr.some((u) => (u.user?._id || u.user) === id);
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;
  const text = message.text || message.content;
  const [showBar, setShowBar] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const hoverTimeout = React.useRef();
  const pressTimeout = React.useRef();
  const urls = React.useMemo(() => extractUrls(text), [text]);
  const firstUrl = urls[0];
  const [preview, setPreview] = React.useState(null);
  const [loadingPreview, setLoadingPreview] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    if (!firstUrl) return undefined;
    if (previewCache[firstUrl]) {
      setPreview(previewCache[firstUrl]);
      return undefined;
    }
    setLoadingPreview(true);
    fetchLinkPreview(firstUrl)
      .then((data) => {
        if (!active) return;
        previewCache[firstUrl] = data;
        setPreview(data);
      })
      .finally(() => {
        if (active) setLoadingPreview(false);
      });
    return () => {
      active = false;
    };
  }, [firstUrl]);

  const openBar = () => setShowBar(true);
  const closeBar = () => setShowBar(false);

  const handleKeyDown = (e) => {
    if (e.key.toLowerCase() === 'r') {
      e.preventDefault();
      openBar();
    } else if (e.key === 'Escape') {
      closeBar();
    }
  };

  const handleMouseEnter = () => {
    if (!isTouch) {
      hoverTimeout.current = setTimeout(openBar, 80);
    }
  };

  const handleMouseLeave = () => {
    if (!isTouch) {
      clearTimeout(hoverTimeout.current);
      closeBar();
    }
  };

  const handlePointerDown = () => {
    if (isTouch) {
      pressTimeout.current = setTimeout(() => setShowMenu(true), 350);
    }
  };

  const handlePointerUp = () => {
    if (isTouch) {
      clearTimeout(pressTimeout.current);
    }
  };

  const handleCopy = () => {
    if (text) {
      navigator.clipboard?.writeText(text);
    }
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(message._id || message.id);
    }
  };

  const renderAttachment = (attachment) => {
    const type = attachment.type || '';
    if (type.startsWith('image/')) {
      return (
        <img
          src={attachment.url}
          alt={attachment.name || 'image'}
          className="mt-2 max-w-xs rounded-md"
        />
      );
    }
    return (
      <a
        href={attachment.url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-sm text-blue-600 underline"
      >
        {attachment.name || 'Attachment'}
      </a>
    );
  };

  React.useEffect(() => {
    if (!socket || isOwn) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.intersectionRatio >= 0.6) {
            if (!hasUser(message.readBy, currentUser._id)) {
              socket.emit('ack-read', { messageId: message._id });
            }
          }
        });
      },
      { threshold: 0.6 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [socket, message._id, message.readBy, currentUser._id, isOwn]);

  const msgDate = new Date(message.createdAt);
  const shortTime = format(msgDate, 'h:mm a');
  const fullTime = msgDate.toLocaleString();

  return (
    <div
      ref={setRefs}
      className="relative group pr-12"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {text && (
        <div className="text-[15px] leading-6 whitespace-pre-wrap break-words">
          {linkify(text)}
        </div>
      )}

      {firstUrl && (
        <LinkPreviewCard preview={preview} isLoading={loadingPreview} />
      )}

      {message.attachments &&
        message.attachments.map((att) => (
          <div key={att.id || att.url}>{renderAttachment(att)}</div>
        ))}

      <div className="mt-1 flex justify-end items-center gap-1 text-xs text-gray-500">
        <time dateTime={msgDate.toISOString()} title={fullTime}>
          {shortTime}
        </time>
        {isOwn && <MessageStatusTicks status={message.status} />}
      </div>

      {showBar && (
        <div className="absolute -top-8 left-0 z-10">
          <ReactionBar
            onSelect={(emoji) =>
              toggleReaction(message._id || message.id, emoji)
            }
            onClose={closeBar}
          />
        </div>
      )}

      {message.reactions && (
        <ReactionChips
          message={message}
          currentUserId={currentUser?._id}
          onReact={(emoji) =>
            toggleReaction(message._id || message.id, emoji)
          }
        />
      )}

      <div className="absolute top-1 right-1 flex items-center gap-2 z-20">
        <MessageActionsMenu
          isOpen={showMenu}
          onOpen={() => setShowMenu(true)}
          onClose={() => setShowMenu(false)}
          onReply={onReply}
          onCopy={handleCopy}
          onStartThread={() => openThread(message)}
          onDelete={handleDelete}
          showStartThread={!message.parentMessageId}
          showDelete={isOwn}
          isTouch={isTouch}
        />
      </div>

      {message.threadCount > 0 && !message.parentMessageId && (
        <button
          onClick={() => openThread(message)}
          className="mt-1 text-xs text-blue-600 hover:underline"
        >
          {message.threadCount}{' '}
          {message.threadCount === 1 ? 'reply' : 'replies'} → View thread
        </button>
      )}
    </div>
  );
});

export default MessageItem;