import React from 'react';
import {
  ClipboardIcon,
  TrashIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
} from '@heroicons/react/24/outline';
import { useChat } from '../../hooks/useChat';
import linkify from '../../utils/linkify';
import ReactionBar from './ReactionBar';
import ReactionChips from './ReactionChips';

const MessageItem = ({ message, isOwn, onDelete }) => {
  const { openThread, currentUser, toggleReaction } = useChat();
  const isTouch = typeof window !== 'undefined' && 'ontouchstart' in window;
  const text = message.text || message.content;
  const [showBar, setShowBar] = React.useState(false);
  const hoverTimeout = React.useRef();
  const pressTimeout = React.useRef();

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
      pressTimeout.current = setTimeout(openBar, 350);
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

    const handleTouchStart = (e) => {
      touchStart.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e) => {
      const delta = e.touches[0].clientX - touchStart.current;
      if (delta > 0) {
        setSwipeX(Math.min(delta, 80));
      }
    };

    const handleTouchEnd = () => {
      if (swipeX > 48 && onReply) {
        onReply();
      }
      setSwipeX(0);
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
    return (
    <div
      className="relative group"
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
        {message.attachments &&
          message.attachments.map((att) => (
            <div key={att.id || att.url}>{renderAttachment(att)}</div>
          ))}
        <div
          className={`absolute -top-8 left-0 transition-opacity ${
            isTouch ? '' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <ReactionBar
            ref={barRef}
            message={message}
            currentUserId={currentUser?._id}
            onReact={(emoji) =>
              toggleReaction(message._id || message.id, emoji)
            }
          />
        </div>
        <div className="absolute -top-2 right-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-gray-200 rounded"
            title="Copy"
          >
            <ClipboardIcon className="h-4 w-4" />
          </button>
          {onReply && (
            <button
              onClick={onReply}
              className="p-1 hover:bg-gray-200 rounded"
              title="Reply"
            >
              <ArrowUturnRightIcon className="h-4 w-4" />
            </button>
          )}
          {!message.parentMessageId && (
            <button
              onClick={() => openThread(message)}
              className="p-1 hover:bg-gray-200 rounded"
              title="Reply in thread"
            >
              <ArrowUturnLeftIcon className="h-4 w-4" />
            </button>
          )}
          {isOwn && (
            <button
              onClick={handleDelete}
              className="p-1 hover:bg-gray-200 rounded"
              title="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
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
  }
);

export default MessageItem;