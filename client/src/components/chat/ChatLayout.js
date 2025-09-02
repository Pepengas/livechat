import React, { useState } from 'react';
import SidebarLeft from './SidebarLeft';
import SidebarRight from './SidebarRight';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import Composer from './Composer';
import { useChat } from '../../hooks/useChat';
import { useAuth } from '../../hooks/useAuth';

const ChatLayout = () => {
  const { messages, selectedChat } = useChat();
  const { currentUser } = useAuth();
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="flex h-full bg-app text-[color:var(--text)]">
      <SidebarLeft />
      <div className="flex flex-col flex-1 min-w-0">
        {selectedChat ? (
          <>
            <ChatHeader
              title={selectedChat.chatName || 'Chat'}
              status=""
              avatar=""
              onToggleInfo={() => setShowInfo((v) => !v)}
            />
            <div className="flex-1 overflow-y-auto">
              <MessageList messages={messages} currentUser={currentUser} />
            </div>
            <Composer />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-dim">
            Select a chat to start messaging
          </div>
        )}
      </div>
      <SidebarRight isOpen={showInfo} />
    </div>
  );
};

export default ChatLayout;
