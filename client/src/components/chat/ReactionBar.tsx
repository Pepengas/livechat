import React, { useEffect, useRef } from 'react';

export const DEFAULT_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '👎'];

interface ReactionBarProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
  emojis?: string[];
}

const ReactionBar: React.FC<ReactionBarProps> = ({ onSelect, onClose, emojis = DEFAULT_EMOJIS }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <div
      ref={ref}
      role="menu"
      className="flex bg-panel-2 shadow rounded-full py-1 px-2 gap-1"
    >
      {emojis.map((emoji) => (
        <button
          key={emoji}
          role="menuitem"
          aria-label={`React with ${emoji}`}
          onClick={() => onSelect(emoji)}
          className="w-9 h-9 flex items-center justify-center text-xl hover:scale-110 transition-transform"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
};

export default ReactionBar;
