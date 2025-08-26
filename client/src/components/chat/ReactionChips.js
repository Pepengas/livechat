import React, { useMemo } from 'react';

const ReactionChips = ({ message, currentUserId, onReact }) => {
  const reactions = useMemo(() => {
    const map = new Map();
    (message.reactions || []).forEach(({ emoji, userId }) => {
      if (!map.has(emoji)) map.set(emoji, []);
      map.get(emoji).push(userId);
    });
    return Array.from(map.entries()).map(([emoji, users]) => ({ emoji, users }));
  }, [message.reactions]);

  if (!reactions.length) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
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
    </div>
  );
};

export default ReactionChips;
