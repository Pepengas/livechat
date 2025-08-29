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

const HOVER_DELAY_MS = 450;
const HOVER_TOLERANCE_PX = 8;
const CLOSE_GRACE_MS = 150;
const COOLDOWN_MS = 300;
const LONGPRESS_DELAY_MS = 500;

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

const MessageItem = React.forwardRef(({ message, isOwn, onDelete, onReply, scrollToMessage }, ref) => {
  const { openThread, currentUser, toggleReaction, replyTo, ensureMessageLoaded } = useChat();
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
  const closeTimeout = React.useRef();
  const cooldownRef = React.useRef(false);
  const pointerStart = React.useRef({ x: 0, y: 0 });
  const hovering = React.useRef(false);
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

  const openBar = () => {
    if (showMenu || replyTo || cooldownRef.current) return;
    if (isTouch) {
      setShowMenu(true);
      return;
    }
    setShowBar(true);
    setTimeout(() => {
      containerRef.current
        ?.querySelector('[role="menuitem"]')
        ?.focus();
    }, 0);
  };
  const closeBar = () => {
    if (!showBar) return;
    setShowBar(false);
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, COOLDOWN_MS);
  };

  const cancelHover = React.useCallback(() => {
    hovering.current = false;
    clearTimeout(hoverTimeout.current);
    window.removeEventListener('scroll', cancelHover, true);
    document.removeEventListener('selectionchange', cancelHover);
  }, []);

  const startHover = (e) => {
    if (isTouch || showBar || showMenu || replyTo || cooldownRef.current) return;
    pointerStart.current = { x: e.clientX, y: e.clientY };
    hovering.current = true;
    hoverTimeout.current = setTimeout(() => {
      hovering.current = false;
      cancelHover();
      openBar();
    }, HOVER_DELAY_MS);
    window.addEventListener('scroll', cancelHover, true);
    document.addEventListener('selectionchange', cancelHover);
  };

  const scheduleClose = () => {
    clearTimeout(closeTimeout.current);
    closeTimeout.current = setTimeout(() => {
      closeBar();
    }, CLOSE_GRACE_MS);
  };

  const cancelClose = () => {
    clearTimeout(closeTimeout.current);
  };

  const handleKeyDown = (e) => {
    if (e.key === ':') {
      e.preventDefault();
      openBar();
    } else if (e.key === 'Escape') {
      closeBar();
    }
  };

  const handleMouseEnter = (e) => {
    if (!isTouch) {
      cancelClose();
      startHover(e);
    }
  };

  const handleMouseMove = (e) => {
    if (!isTouch && hovering.current) {
      const dx = e.clientX - pointerStart.current.x;
      const dy = e.clientY - pointerStart.current.y;
      if (Math.hypot(dx, dy) > HOVER_TOLERANCE_PX) {
        cancelHover();
        startHover(e);
      }
    }
  };

  const handleMouseLeave = () => {
    if (!isTouch) {
      cancelHover();
      scheduleClose();
    }
  };

  React.useEffect(() => {
    if (!isTouch) return;
    const el = containerRef.current;
    if (!el) return;
    let timer;
    const cancel = () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', cancel, true);
    };
    const handleTouchStart = (e) => {
      if (showMenu || replyTo) return;
      pointerStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      timer = setTimeout(() => {
        e.preventDefault();
        openBar();
      }, LONGPRESS_DELAY_MS);
      window.addEventListener('scroll', cancel, true);
    };
    const handleTouchMove = (e) => {
      const dx = e.touches[0].clientX - pointerStart.current.x;
      const dy = e.touches[0].clientY - pointerStart.current.y;
      if (Math.hypot(dx, dy) > HOVER_TOLERANCE_PX) {
        cancel();
      }
    };
    const handleTouchEnd = () => cancel();
    el.addEventListener('touchstart', handleTouchStart, { passive: false });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd);
    el.addEventListener('touchcancel', handleTouchEnd);
    return () => {
      cancel();
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
      el.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isTouch, showMenu, replyTo, openBar]);

  React.useEffect(() => {
    if (!isTouch) return;
    const el = containerRef.current;
    if (!el) return;
    const prevent = (e) => showMenu && e.preventDefault();
    el.addEventListener('contextmenu', prevent);
    return () => el.removeEventListener('contextmenu', prevent);
  }, [isTouch, showMenu]);

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

  React.useEffect(() => () => cancelHover(), [cancelHover]);

  React.useEffect(() => {
    if (showMenu || replyTo) {
      cancelHover();
      closeBar();
    }
  }, [showMenu, replyTo, cancelHover]);

  const msgDate = new Date(message.createdAt);
  const shortTime = format(msgDate, 'h:mm a');
  const fullTime = msgDate.toLocaleString();

  return (
    <div
      ref={setRefs}
      className={`relative group select-none md:pr-12 ${
        isOwn ? 'self-end ml-auto max-w-[95%]' : ''
      }`}
      style={{ WebkitTouchCallout: 'none' }}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {message.replyTo && (
        <div
          className="mb-1 p-2 rounded bg-gray-100 dark:bg-gray-700 border-l-2 border-blue-500 cursor-pointer overflow-hidden"
          onClick={async () => {
            const ok = await ensureMessageLoaded(message.replyTo.id);
            if (ok && scrollToMessage) scrollToMessage(message.replyTo.id);
          }}
        >
          {message.replyTo.isUnavailable ? (
            <div className="text-sm text-gray-500">Original message unavailable</div>
          ) : (
            <div>
              <div className="text-xs text-gray-500">
                {message.replyTo.senderId === (currentUser?._id || currentUser?.id)
                  ? 'You'
                  : message.replyTo.senderName}
              </div>
              <div className="text-sm truncate flex items-center gap-2">
                {message.replyTo.thumbUrl && (
                  <img
                    src={message.replyTo.thumbUrl}
                    alt="thumb"
                    className="w-8 h-8 object-cover rounded"
                  />
                )}
                {message.replyTo.excerpt}
              </div>
            </div>
          )}
        </div>
      )}
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
          showReactions={isTouch}
          onReact={(emoji) =>
            toggleReaction(message._id || message.id, emoji)
          }
          referenceRef={containerRef}
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