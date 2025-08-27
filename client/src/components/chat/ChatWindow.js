import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useChat } from '../../hooks/useChat';
import { useSocket } from '../../hooks/useSocket';
import { useDebounce } from '../../hooks/useDebounce';
import { isAtBottom } from '../../utils/scroll';

// Components
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import LoadingSpinner from '../common/LoadingSpinner';
import TypingIndicator from './TypingIndicator';

const BOTTOM_THRESHOLD = 48; // be forgiving; 6px is too strict on some devices

const ChatWindow = ({ toggleMobileMenu, openUserProfileModal, openGroupInfoModal }) => {
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
  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // jump to bottom of the scroll container
  const scrollToBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    // jump instantly on initial loads; smooth only when appropriate
    el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
  };

  // Keep autoScroll in sync with the user's scroll position
  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setAutoScroll(isAtBottom(el, BOTTOM_THRESHOLD));
  };
  
  // Fetch messages when selected chat changes
  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat._id);
    }
  }, [selectedChat?._id]);

  // After messages load for a newly selected chat, jump to the bottom once
  useEffect(() => {
    if (!messageLoading && selectedChat) {
      scrollToBottom();
      setAutoScroll(true);
    }
  }, [messageLoading, selectedChat?._id]);

  // Sender-aware auto-scroll on new messages
  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;

    const isOwn =
      (last.sender?._id || last.sender?.id) === currentUser._id;

    if (isOwn) {
      scrollToBottom();
      setAutoScroll(true); // I just posted → keep me following
      return;
    }

    // Only follow incoming messages if I'm already at/near the bottom
    if (autoScroll && isAtBottom(scrollContainerRef.current, BOTTOM_THRESHOLD)) {
      scrollToBottom();
    }
  }, [messages, autoScroll, currentUser._id]);
  
  // Handle typing indicator
  const debouncedIsTyping = useDebounce(isTyping, 1000);
  
  useEffect(() => {
    if (selectedChat && debouncedIsTyping) {
      stopTyping(selectedChat._id);
      setIsTyping(false);
    }
  }, [debouncedIsTyping, selectedChat?._id]);
  
  const handleTyping = () => {
    if (!isTyping && selectedChat) {
      setIsTyping(true);
      startTyping(selectedChat._id);
    }
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
      <div key="placeholder" className="chat-shell">
        <div className="flex flex-col items-center justify-center h-full bg-gray-200 dark:bg-gray-700 p-4 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <h2 className="mt-4 text-xl font-semibold text-gray-700 dark:text-gray-100">Welcome to LiveChat</h2>
          <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-md">
            Select a chat from the sidebar or search for users to start a new conversation.
          </p>
          <button
            onClick={toggleMobileMenu}
            className="mt-6 md:hidden inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-primary-500 to-primary-700 shadow-md hover:shadow-lg transition"
          >
            Open Chats
          </button>
        </div>
      </div>
    );
  }

  return (
    <div key={selectedChat._id} className="chat-shell">
          {/* Chat Header */}
          <div className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 mr-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
                aria-label="Back"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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
          <div
            ref={scrollContainerRef}
            className="chat-scroll"
            onScroll={handleScroll}
          >
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
                <TypingIndicator text={getTypingText()} />
              )}

              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Message Input */}
          <div className="border-t border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700">
            <div className="chat-column">
              <MessageInput chatId={selectedChat._id} onTyping={handleTyping} />
            </div>
          </div>
      </div>
    );
  };

export default ChatWindow;