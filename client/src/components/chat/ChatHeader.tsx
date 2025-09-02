import React from 'react';

interface ChatHeaderProps {
  title: string;
  status?: string;
  avatar?: string;
  onToggleInfo?: () => void;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, status, avatar, onToggleInfo }) => {
  return (
    <header className="h-14 px-4 flex items-center justify-between sticky top-0 backdrop-blur bg-panel/80 z-20">
      <div className="flex items-center gap-3">
        {avatar && <img src={avatar} alt={title} className="w-10 h-10 rounded-full" />}
        <div>
          <div className="font-semibold">{title}</div>
          {status && <div className="text-xs text-dim">{status}</div>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button aria-label="Search" className="p-2 rounded-full hover:bg-panel-2">🔍</button>
        <button aria-label="Call" className="p-2 rounded-full hover:bg-panel-2">📞</button>
        <button aria-label="Info" onClick={onToggleInfo} className="p-2 rounded-full hover:bg-panel-2">i</button>
        <button aria-label="More" className="p-2 rounded-full hover:bg-panel-2">⋮</button>
      </div>
    </header>
  );
};

export default ChatHeader;
