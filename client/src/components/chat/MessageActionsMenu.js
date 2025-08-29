import React from 'react';
import {
  EllipsisVerticalIcon,
  ClipboardIcon,
  ArrowUturnLeftIcon,
  ArrowUturnRightIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
} from '@floating-ui/react-dom';
import { createPortal } from 'react-dom';
import { DEFAULT_EMOJIS } from './ReactionBar';

const MessageActionsMenu = ({
  isOpen,
  onOpen,
  onClose,
  onReply,
  onCopy,
  onStartThread,
  onDelete,
  showStartThread,
  showDelete,
  isTouch,
  showReactions = false,
  onReact,
  referenceRef,
}) => {
  const menuRef = React.useRef(null);
  const { x, y, strategy, refs } = useFloating({
    placement: 'bottom-end',
    middleware: [
      offset(({ rects }) => -rects.reference.height),
      flip(),
      shift(),
    ],
    whileElementsMounted: isOpen ? autoUpdate : undefined,
  });

  React.useEffect(() => {
    if (referenceRef?.current) {
      refs.setReference(referenceRef.current);
    }
  }, [referenceRef, refs]);

  const toggleMenu = () => {
    if (isOpen) onClose();
    else onOpen();
  };

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Tab') {
        e.preventDefault();
        const items = menuRef.current.querySelectorAll('button');
        const currentIndex = Array.from(items).indexOf(document.activeElement);
        let nextIndex = 0;
        if (e.key === 'ArrowDown' || (!e.shiftKey && e.key === 'Tab')) {
          nextIndex = (currentIndex + 1) % items.length;
        } else if (e.key === 'ArrowUp' || (e.shiftKey && e.key === 'Tab')) {
          nextIndex = (currentIndex - 1 + items.length) % items.length;
        }
        items[nextIndex]?.focus();
      } else if (e.key === 'Enter') {
        if (document.activeElement && document.activeElement.click) {
          document.activeElement.click();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    const first = menuRef.current.querySelector('button');
    first && first.focus();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleAction = (action) => () => {
    action();
    onClose();
  };

  const menuButtonClass = isTouch
    ? 'hidden'
    : 'opacity-0 group-hover:opacity-100';

  return (
    <div className={`relative ${menuButtonClass} transition-opacity`}>
      <button
        ref={referenceRef ? undefined : refs.setReference}
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="p-1 hover:bg-gray-200 rounded"
        onClick={toggleMenu}
      >
        <EllipsisVerticalIcon className="h-4 w-4" />
      </button>
      {isOpen &&
        createPortal(
          <>
            <div
              data-testid="backdrop"
              className="fixed inset-0"
              style={{ zIndex: 'calc(var(--z-popover, 1000) - 1)' }}
              onClick={onClose}
            />
            <div
              ref={(node) => {
                menuRef.current = node;
                refs.setFloating(node);
              }}
              role="menu"
              aria-label="Message actions"
              style={{
                position: strategy,
                top: y ?? 0,
                left: x ?? 0,
                zIndex: 'var(--z-popover, 1000)',
              }}
              className="w-40 rounded-md shadow-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 py-1"
            >
              {showReactions && (
                <div className="flex justify-center gap-1 px-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  {DEFAULT_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      aria-label={`React with ${emoji}`}
                      onClick={handleAction(() => onReact(emoji))}
                      className="w-9 h-9 flex items-center justify-center text-xl hover:scale-110 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <button
                role="menuitem"
                onClick={handleAction(onReply)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <ArrowUturnRightIcon className="h-4 w-4" /> Reply
              </button>
              <button
                role="menuitem"
                onClick={handleAction(onCopy)}
                className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <ClipboardIcon className="h-4 w-4" /> Copy
              </button>
              {showStartThread && (
                <button
                  role="menuitem"
                  onClick={handleAction(onStartThread)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <ArrowUturnLeftIcon className="h-4 w-4" /> Start Thread
                </button>
              )}
              {showDelete && (
                <button
                  role="menuitem"
                  onClick={handleAction(onDelete)}
                  className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <TrashIcon className="h-4 w-4" /> Delete
                </button>
              )}
              <button
                role="menuitem"
                onClick={onClose}
                className="flex w-full items-center gap-2 px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </>,
          document.body
        )}
    </div>
  );
};

export default MessageActionsMenu;

