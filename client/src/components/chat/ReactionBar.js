import React, { useState, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import EmojiPicker from 'emoji-picker-react';

const ReactionBar = forwardRef(({ message, currentUserId, onReact }, ref) => {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);

  const reactions = useMemo(() => {
    const map = {};
    const order = [];
    (message.reactions || []).forEach(({ emoji, userId }) => {
      if (!map[emoji]) {
        map[emoji] = [];
        order.push(emoji);
      }
      map[emoji].push(userId);
    });
    return order.slice(0, 6).map((emoji) => ({ emoji, users: map[emoji] }));
  }, [message.reactions]);

  useImperativeHandle(ref, () => ({
    openPicker: () => setShowPicker(true),
  }));

  const handleEmojiClick = (emojiData) => {
    const emoji = emojiData.emoji || emojiData;
    onReact(emoji);
    setShowPicker(false);
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false);
      }
    };
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPicker]);

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-1">
        {reactions.map(({ emoji, users }) => {
          const reacted = users.includes(currentUserId);
          return (
            <button
              key={emoji}
              onClick={() => onReact(emoji)}
              className={`text-xs px-2 py-0.5 rounded-full border flex items-center max-w-[60px] truncate ${reacted ? 'bg-blue-100 border-blue-300' : 'bg-gray-100 border-gray-200'}`}
            >
              <span className="mr-1">{emoji}</span>
              <span className="truncate">{users.length}</span>
            </button>
          );
        })}
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="text-xs px-2 py-0.5 rounded-full border bg-gray-100 border-gray-200"
        >
          +
        </button>
      </div>
      {showPicker && (
        <div ref={pickerRef} className="absolute z-10 mt-1">
          <EmojiPicker onEmojiClick={handleEmojiClick} autoFocusSearch={false} />
        </div>
      )}
    </div>
  );
});

export default ReactionBar;
