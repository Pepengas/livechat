import React from 'react';
import { EllipsisVerticalIcon, ClipboardIcon, ArrowUturnLeftIcon, TrashIcon } from '@heroicons/react/24/outline';

const MessageActionsMenu = ({
  isOpen,
  onOpen,
  onClose,
  onCopy,
  onStartThread,
  onDelete,
  showStartThread,
  showDelete,
  isTouch,
}) => {
  const menuRef = React.useRef(null);
  const buttonRef = React.useRef(null);

  const toggleMenu = () => {
    if (isOpen) onClose();
    else onOpen();
  };

  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        onClose();
      }
    };

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

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    const first = menuRef.current.querySelector('button');
    first && first.focus();

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
        ref={buttonRef}
        aria-label="More options"
        className="p-1 hover:bg-gray-200 rounded"
        onClick={toggleMenu}
      >
        <EllipsisVerticalIcon className="h-4 w-4" />
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Message actions"
          className={
            "absolute z-30 right-0 mt-1 w-32 rounded-md shadow-lg bg-white dark:bg-gray-800 " +
            "text-gray-700 dark:text-gray-200 py-1"
          }
        >
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
        </div>
      )}
    </div>
  );
};

export default MessageActionsMenu;

