import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const focusableSelectors = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const OverflowMenu = ({ open, onClose, anchorEl, children }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const previousActive = document.activeElement;
    const firstFocusable = menuRef.current?.querySelector(focusableSelectors);
    firstFocusable?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusable = menuRef.current?.querySelectorAll(focusableSelectors);
        if (!focusable || focusable.length === 0) return;
        const index = Array.prototype.indexOf.call(focusable, document.activeElement);
        if (e.shiftKey) {
          if (index === 0) {
            e.preventDefault();
            focusable[focusable.length - 1].focus();
          }
        } else {
          if (index === focusable.length - 1) {
            e.preventDefault();
            focusable[0].focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previousActive && previousActive.focus();
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open, onClose]);

  if (!open) return null;

  let style = { top: '1rem', right: '1rem' };
  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    style = { top: `${rect.bottom + 8}px`, right: `${window.innerWidth - rect.right}px` };
  }

  return createPortal(
    <div className="fixed inset-0 z-50" onMouseDown={onClose}>
      <div
        ref={menuRef}
        className="absolute bg-white dark:bg-gray-700 rounded-md shadow-lg py-2 w-48"
        style={style}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  );
};

export default OverflowMenu;

