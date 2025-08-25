import React, { useEffect, useRef, useState } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';
import MessageItem from './MessageItem';
import '../../styles/thread.css';

const ThreadPanel = () => {
  const { activeThreadParent, threadMessages, closeThread, sendThreadMessage } = useChat();
  const { currentUser } = useAuth();
  const [text, setText] = useState('');
  const panelRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (activeThreadParent) {
      panelRef.current?.focus();
    }
  }, [activeThreadParent]);

  useEffect(() => {
    if (!activeThreadParent) return;
    const handleFocus = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        e.stopPropagation();
        panelRef.current.focus();
      }
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        closeThread();
      }
    };
    document.addEventListener('focusin', handleFocus);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('focusin', handleFocus);
      document.removeEventListener('keydown', handleKey);
    };
  }, [activeThreadParent, closeThread]);

  useEffect(() => {
    const last = threadMessages[threadMessages.length - 1];
    if (!last) return;
    const isMine = (last.sender?._id || last.sender?.id) === currentUser._id;
    if (isMine) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [threadMessages, currentUser]);

  if (!activeThreadParent) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await sendThreadMessage(text.trim());
    setText('');
  };

  return (
    <div className="thread-overlay" onClick={closeThread}>
      <div
        className="thread-panel bg-white" onClick={(e) => e.stopPropagation()} ref={panelRef} tabIndex={-1}
      >
        <div className="p-4 border-b">
          <MessageItem message={activeThreadParent} isOwn={(activeThreadParent.sender?._id || activeThreadParent.sender?.id) === currentUser._id} />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {threadMessages.map((m) => (
            <MessageItem
              key={m._id || m.id}
              message={m}
              isOwn={(m.sender?._id || m.sender?.id) === currentUser._id}
            />
          ))}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleSubmit} className="p-2 border-t">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full border rounded p-2"
            placeholder="Reply..."
          />
        </form>
      </div>
    </div>
  );
};

export default ThreadPanel;
