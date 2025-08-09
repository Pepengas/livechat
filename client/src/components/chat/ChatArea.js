import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { useDebounce } from '../../hooks/useDebounce';

// Components
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import LoadingSpinner from '../common/LoadingSpinner';

const ChatArea = ({ toggleMobileMenu, openUserProfileModal, openGroupInfoModal }) => {
  const { currentUser } = useAuth();
  const { 
    selectedChat, 
    messages, 
    fetchMessages, 
    messageLoading, 
    typingUsers,
    startTyping,
    stopTyping
  } = useChat();
  const { isUserOnline } = useSocket();
  
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  // Fetch messages when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
    }
  }, [selectedChat]);
  
  // Handle typing indicator
  const debouncedIsTyping = useDebounce(isTyping, 1000);
  
  useEffect(() => {
    if (selectedChat) {
      if (debouncedIsTyping) {
        stopTyping(selectedChat._id);
        setIsTyping(false);
      }
    }
  }, [debouncedIsTyping, selectedChat]);
  
  const handleTyping = () => {
    if (!isTyping && selectedChat) {
      setIsTyping(true);
      startTyping(selectedChat._id);
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Get chat name
  const getChatName = () => {
    if (!selectedChat) return '';
    
    if (selectedChat.isGroupChat) {
      return selectedChat.name;
    }
    
    const otherUser = selectedChat.users.find(
      (p) => p._id !== currentUser._id
    );
    
    return otherUser?.name || 'Deleted User';
  };
  
  // Get chat status
  const getChatStatus = () => {
    if (!selectedChat) return '';
    
    if (selectedChat.isGroupChat) {
      return `${selectedChat.users.length} members`;
    }
    
    const otherUser = selectedChat.users.find(
      (p) => p._id !== currentUser._id
    );
    
    if (!otherUser) return 'Unavailable';
    
    return isUserOnline(otherUser._id) ? 'Online' : 'Offline';
  };
  
  // Get chat avatar
  const getChatAvatar = () => {
    if (!selectedChat) return '';
    
    if (selectedChat.isGroupChat) {
      return selectedChat.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedChat.name)}&background=random`;
    }
    
    const otherUser = selectedChat.users.find(
      (p) => p._id !== currentUser._id
    );
    
    if (!otherUser) return `https://ui-avatars.com/api/?name=User&background=random`;
    
    return otherUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.name)}&background=random`;
  };
  
  // Get typing users text
  const getTypingText = () => {
    if (!selectedChat || !typingUsers[selectedChat._id] || typingUsers[selectedChat._id].length === 0) {
      return null;
    }
    
    const users = typingUsers[selectedChat._id];
    
    if (users.length === 1) {
      return `${users[0].name} is typing...`;
    }
    
    if (users.length === 2) {
      return `${users[0].name} and ${users[1].name} are typing...`;
    }
    
    return `${users[0].name} and ${users.length - 1} others are typing...`;
  };
  
  // Handle profile click
  const handleProfileClick = () => {
    if (!selectedChat) return;
    
    if (selectedChat.isGroupChat) {
      openGroupInfoModal();
    } else {
      const otherUser = selectedChat.users.find(
        (p) => p._id !== currentUser._id
      );
      
      if (otherUser) {
        openUserProfileModal(otherUser);
      }
    }
  };

  if (!selectedChat) {
    return (
      <div className="chat-shell">
        <div className="flex flex-col items-center justify-center h-full bg-gray-200 dark:bg-gray-700 p-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-100">Welcome to LiveChat</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400 text-center max-w-md">
            Select a chat from the sidebar or search for users to start a new conversation.
          </p>
          <button
            onClick={toggleMobileMenu}
            className="mt-6 md:hidden inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Open Chats
          </button>
        </div>
      </div>
    );
  }

  return (
<div className="chat-shell">
          {/* Chat Header */}
          <div className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 mr-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label="Menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div className="flex items-center cursor-pointer" onClick={handleProfileClick}>
                <img 
                  src={getChatAvatar()} 
                  alt={getChatName()}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div className="ml-3">
                  <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{getChatName()}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{getChatStatus()}</p>
                </div>
              </div>
            </div>
            <div>
              {selectedChat.isGroupChat ? (
                <button
                  onClick={openGroupInfoModal}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  aria-label="Group"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
              ) : (
                <button
                  onClick={() => {
                    const otherUser = selectedChat.users.find(
                      (p) => p._id !== currentUser._id
                    );
                    if (otherUser) {
                      openUserProfileModal(otherUser);
                    }
                  }}
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                  aria-label="User Info"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
          
          {/* Messages */}
          <div className="chat-scroll">
            <div className="chat-column">
              {messageLoading ? (
                <div className="flex justify-center items-center h-full">
                  <LoadingSpinner />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="mt-4 text-lg">No messages yet</p>
                  <p className="text-sm">Send a message to start the conversation</p>
                </div>
              ) : (
                <MessageList
                  messages={messages}
                  currentUser={currentUser}
                  selectedChat={selectedChat}
                />
              )}

              {getTypingText() && (
                <div className="typing-indicator text-gray-500 dark:text-gray-400 text-sm">
                  {getTypingText()}
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
            <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-gray-100 dark:bg-gray-700">
              <MessageInput chatId={selectedChat._id} onTyping={handleTyping} />
            </div>
      </div>
    );
  };

export default ChatArea;