import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { formatDistanceToNow } from 'date-fns';
import MessageStatusTicks from './MessageStatusTicks';

const ChatList = ({ chats, openUserProfileModal }) => {
  const { currentUser } = useAuth();
  const { selectedChat, setSelectedChat, unreadCounts } = useChat();
  const { isUserOnline } = useSocket();

  // Get the other user in a one-to-one chat
  const getChatName = (chat) => {
    if (chat.isGroupChat) {
      return chat.name;
    }
    return chat.users.find(p => p._id !== currentUser._id)?.name || 'Deleted User';
  };

  // Get the avatar for the chat
  const getChatAvatar = (chat) => {
    if (chat.isGroupChat) {
      return chat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chat.name)}&background=random`;
    }
    const otherUser = chat.users.find(p => p._id !== currentUser._id);
    return otherUser?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser?.name || 'User')}&background=random`;
  };

  // Get the latest message preview
  const getLatestMessagePreview = (chat) => {
    if (!chat.latestMessage) return 'No messages yet';
    
    const sender = chat.latestMessage.sender._id === currentUser._id ? 'You: ' : '';
    
    if (chat.latestMessage.attachments && chat.latestMessage.attachments.length > 0) {
      const attachment = chat.latestMessage.attachments[0];
      return `${sender}${getAttachmentPreview(attachment)}`;
    }
    
    return `${sender}${chat.latestMessage.content || ''}`;
  };

  // Get a preview text for an attachment
  const getAttachmentPreview = (attachment) => {
    const type = attachment.type.split('/')[0];
    switch (type) {
      case 'image':
        return '📷 Photo';
      case 'video':
        return '🎥 Video';
      case 'audio':
        return '🎵 Audio';
      default:
        return '📎 File';
    }
  };

  // Format the timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  // Check if the other user is online (for one-to-one chats)
  const isChatUserOnline = (chat) => {
    if (chat.isGroupChat) return false;
    const otherUser = chat.users.find(p => p._id !== currentUser._id);
    return otherUser && isUserOnline(otherUser._id);
  };

  return (
    <div className="divide-y divide-gray-200 dark:divide-gray-600">
      {chats.map((chat) => {
        const isSelected = selectedChat && selectedChat._id === chat._id;
        const unreadCount = unreadCounts[chat._id] || 0;
        const chatName = getChatName(chat);
        const isOnline = isChatUserOnline(chat);
        
        return (
          <div
            key={chat._id}
            className={`p-4 cursor-pointer rounded-lg transition-colors duration-200 bg-gray-100 dark:bg-gray-700 hover:shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 ${isSelected ? 'bg-gray-200 dark:bg-gray-600 shadow' : ''}`}
            onClick={() => setSelectedChat(chat)}
          >
            <div className="flex items-center">
              <div className="relative">
                <img 
                  src={getChatAvatar(chat)} 
                  alt={chatName}
                  className="h-12 w-12 rounded-full object-cover"
                />
                {isOnline && (
                  <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></span>
                )}
              </div>
              <div className="ml-3 flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{chatName}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatTime(chat.latestMessage?.createdAt)}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center min-w-0">
                    {chat.latestMessage?.sender._id === currentUser._id && (
                      <MessageStatusTicks
                        status={chat.latestMessage.status}
                        className="mr-1"
                      />
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {getLatestMessagePreview(chat)}
                    </p>
                  </div>
                  {unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary-600 text-xs font-medium text-white">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {!chat.isGroupChat && (
              <div className="mt-2 flex justify-end">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
    const otherUser = chat.users.find(p => p._id !== currentUser._id);
                    if (otherUser) {
                      openUserProfileModal(otherUser);
                    }
                  }}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  Profile
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default ChatList;