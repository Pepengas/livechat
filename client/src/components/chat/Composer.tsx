import React, { useState } from 'react';

interface ComposerProps {
  onSend?: (text: string) => void;
}

const Composer: React.FC<ComposerProps> = ({ onSend }) => {
  const [text, setText] = useState('');
  const handleSend = () => {
    if (!text.trim()) return;
    onSend?.(text);
    setText('');
  };
  return (
    <div className="p-2 flex items-end gap-2 bg-panel">
      <button aria-label="Add" className="p-2">+</button>
      <button aria-label="Emoji" className="p-2">😊</button>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Message"
        rows={1}
        className="flex-1 resize-none max-h-[140px] rounded-3xl px-4 py-2 bg-panel-2 text-[color:var(--text)] focus:outline-none"
      />
      <button
        aria-label={text ? 'Send message' : 'Record voice'}
        className="p-2"
        onClick={text ? handleSend : undefined}
      >
        {text ? '➤' : '🎤'}
      </button>
    </div>
  );
};

export default Composer;
