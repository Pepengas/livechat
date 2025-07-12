import React, { createContext, useState, useEffect, useContext } from 'react';
import { getChats, accessChat, createGroupChat, renameGroup, addToGroup, removeFromGroup, leaveGroup } from '../services/chatService';
import { getMessages, sendMessage, markAsRead, deleteMessage } from '../services/messageService';
import { AuthContext } from './AuthContext';
import { SocketContext } from './SocketContext';

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});

  // Fetch all chats when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
    }
  }, [isAuthenticated]);

  // Join chat rooms when selected chat changes
  useEffect(() => {
    if (!socket) return;

    if (selectedChat) {
      socket.emit('join-chat', selectedChat._id);
      console.log('Joined chat', selectedChat._id);
    }

    return () => {
      if (selectedChat) {
        socket.emit('leave-chat', selectedChat._id);
        console.log('Left chat', selectedChat._id);
      }
    };
  }, [socket, selectedChat]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // New message received
    socket.on('message-received', (newMessage) => {
      // Update messages if in the same chat
      if (selectedChat && selectedChat._id === newMessage.chat._id) {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
        // Mark as read immediately if we're in this chat
        markMessageAsRead(newMessage.chat._id);
      } else {
        // Update unread count for this chat
        setUnreadCounts((prev) => ({
          ...prev,
          [newMessage.chat._id]: (prev[newMessage.chat._id] || 0) + 1
        }));
      }

      // Update chat list to show latest message
      setChats((prevChats) => {
        const updatedChat = {
          ...newMessage.chat,
          latestMessage: newMessage
        };

        // Remove the chat from the list and add it to the beginning
        const filteredChats = prevChats.filter(
          (chat) => chat._id !== newMessage.chat._id
        );
        return [updatedChat, ...filteredChats];
      });
    });

    // User typing
    socket.on('typing', ({ chatId, user }) => {
      if (user._id !== currentUser._id) {
        setTypingUsers((prev) => ({
          ...prev,
          [chatId]: [...(prev[chatId] || []), user]
        }));
      }
    });

    // User stopped typing
    socket.on('stop-typing', ({ chatId, user }) => {
      if (user._id !== currentUser._id) {
        setTypingUsers((prev) => ({
          ...prev,
          [chatId]: (prev[chatId] || []).filter((u) => u._id !== user._id)
        }));
      }
    });

    // Chat updated (renamed, members added/removed)
    socket.on('chat:updated', (updatedChat) => {
      setChats((prevChats) =>
        prevChats.map((chat) =>
          chat._id === updatedChat._id ? updatedChat : chat
        )
      );

      // Update selected chat if it's the one that was updated
      if (selectedChat && selectedChat._id === updatedChat._id) {
        setSelectedChat(updatedChat);
      }
    });

    // New chat created (added to group)
    socket.on('chat:created', (newChat) => {
      setChats((prevChats) => [newChat, ...prevChats]);
    });

    // Removed from chat
    socket.on('chat:removed', (chatId) => {
      setChats((prevChats) => prevChats.filter((chat) => chat._id !== chatId));
      
      // If the removed chat is the selected chat, clear selection
      if (selectedChat && selectedChat._id === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
    });

    // Message deleted
    socket.on('message:deleted', ({ messageId, chatId, newLatestMessage }) => {
      // Update messages if in the same chat
      if (selectedChat && selectedChat._id === chatId) {
        setMessages((prevMessages) => 
          prevMessages.filter((msg) => msg._id !== messageId)
        );
      }

      // Update chat list with new latest message
      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat._id === chatId) {
            return {
              ...chat,
              latestMessage: newLatestMessage
            };
          }
          return chat;
        });
      });
    });

    // Message read
    socket.on('messages-read', ({ chatId, userId }) => {
      if (selectedChat && selectedChat._id === chatId) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) => {
            if (!msg.readBy.includes(userId)) {
              return {
                ...msg,
                readBy: [...msg.readBy, userId]
              };
            }
            return msg;
          })
        );
      }
    });

    // User avatar updated
    socket.on('user-avatar-updated', ({ userId, avatar }) => {
      setChats((prevChats) =>
        prevChats.map((chat) => ({
          ...chat,
          users: chat.users.map((u) =>
            u._id === userId ? { ...u, avatar } : u
          ),
          latestMessage: chat.latestMessage &&
            chat.latestMessage.sender._id === userId
            ? {
                ...chat.latestMessage,
                sender: { ...chat.latestMessage.sender, avatar },
              }
            : chat.latestMessage,
        }))
      );

      setMessages((prevMessages) =>
        prevMessages.map((m) =>
          m.sender._id === userId
            ? { ...m, sender: { ...m.sender, avatar } }
            : m
        )
      );
    });

    return () => {
      socket.off('message-received');
      socket.off('typing');
      socket.off('stop-typing');
      socket.off('chat:updated');
      socket.off('chat:created');
      socket.off('chat:removed');
      socket.off('message:deleted');
      socket.off('messages-read');
      socket.off('user-avatar-updated');
    };
  }, [socket, selectedChat, currentUser]);

  const fetchChats = async () => {
    setChatLoading(true);
    setError(null);
    try {
      const data = await getChats();
      setChats(data);
      
      // Initialize unread counts
      const counts = {};
      data.forEach(chat => {
        const unreadMessages = chat.latestMessage && 
          chat.latestMessage.sender._id !== currentUser._id && 
          !chat.latestMessage.readBy.includes(currentUser._id) ? 1 : 0;
        counts[chat._id] = unreadMessages;
      });
      setUnreadCounts(counts);
    } catch (err) {
      setError(err.message || 'Failed to fetch chats');
    } finally {
      setChatLoading(false);
    }
  };

  const fetchMessages = async (chatId) => {
    setMessageLoading(true);
    setError(null);
    try {
      const data = await getMessages(chatId);
      setMessages(data);
      // Mark messages as read when fetched
      markMessageAsRead(chatId);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch messages');
      return [];
    } finally {
      setMessageLoading(false);
    }
  };

  const createOrAccessChat = async (userId) => {
    setChatLoading(true);
    setError(null);
    try {
      const data = await accessChat(userId);

      // Check if chat already exists in the list
      const chatExists = chats.find(c => c._id === data._id);

      if (!chatExists) {
        setChats(prev => [data, ...prev]);
      }
      
      setSelectedChat(data);
      await fetchMessages(data._id);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to access chat');
      throw err;
    } finally {
      setChatLoading(false);
    }
  };

  const createNewGroupChat = async (users, name) => {
    setChatLoading(true);
    setError(null);
    try {
      const data = await createGroupChat(users, name);
      setChats(prev => [data, ...prev]);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to create group chat');
      throw err;
    } finally {
      setChatLoading(false);
    }
  };

  const updateGroupName = async (chatId, name) => {
    setLoading(true);
    setError(null);
    try {
      const data = await renameGroup(chatId, name);
      
      // Update chats list
      setChats(prev =>
        prev.map(chat =>
          chat._id === chatId ? data : chat
        )
      );
      
      // Update selected chat if it's the one being renamed
      if (selectedChat && selectedChat._id === chatId) {
        setSelectedChat(data);
      }
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to rename group');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addUserToGroup = async (chatId, userId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await addToGroup(chatId, userId);
      
      // Update chats list
      setChats(prev =>
        prev.map(chat =>
          chat._id === chatId ? data : chat
        )
      );
      
      // Update selected chat if it's the one being modified
      if (selectedChat && selectedChat._id === chatId) {
        setSelectedChat(data);
      }
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to add user to group');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeUserFromGroup = async (chatId, userId) => {
    setLoading(true);
    setError(null);
    try {
      const data = await removeFromGroup(chatId, userId);
      
      // Update chats list
      setChats(prev =>
        prev.map(chat =>
          chat._id === chatId ? data : chat
        )
      );
      
      // Update selected chat if it's the one being modified
      if (selectedChat && selectedChat._id === chatId) {
        setSelectedChat(data);
      }
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to remove user from group');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const leaveGroupChat = async (chatId) => {
    setLoading(true);
    setError(null);
    try {
      await leaveGroup(chatId);
      
      // Remove chat from list
      setChats(prev => prev.filter(chat => chat._id !== chatId));
      
      // Clear selected chat if it's the one being left
      if (selectedChat && selectedChat._id === chatId) {
        setSelectedChat(null);
        setMessages([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to leave group');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendNewMessage = async (chatId, content, attachments = []) => {
    setError(null);
    try {
      const data = await sendMessage(chatId, content, attachments);

      if (socket) {
        socket.emit('new-message', data);
        console.log('Emitted new-message', data);
      }
      
      // Add message to current chat
      setMessages([...messages, data]);
      
      // Update chat list to show latest message
      setChats(prevChats => {
        const updatedChat = {
          ...prevChats.find(c => c._id === chatId),
          latestMessage: data
        };
        
        // Remove the chat from the list and add it to the beginning
        const filteredChats = prevChats.filter(chat => chat._id !== chatId);
        return [updatedChat, ...filteredChats];
      });
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to send message');
      throw err;
    }
  };

  const markMessageAsRead = async (chatId) => {
    try {
      await markAsRead(chatId);
      
      // Clear unread count for this chat
      setUnreadCounts(prev => ({
        ...prev,
        [chatId]: 0
      }));
      
      // Update read status in messages
      if (selectedChat && selectedChat._id === chatId) {
        setMessages(prevMessages => 
          prevMessages.map(msg => ({
            ...msg,
            readBy: msg.readBy.includes(currentUser._id) 
              ? msg.readBy 
              : [...msg.readBy, currentUser._id]
          }))
        );
      }
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const deleteMessageById = async (messageId, chatId) => {
    setError(null);
    try {
      const data = await deleteMessage(messageId);
      
      // Remove message from current chat
      setMessages(messages.filter(msg => msg._id !== messageId));
      
      // Update chat list if latest message was deleted
      if (data.updatedLatestMessage) {
        setChats(prevChats => 
          prevChats.map(chat => {
            if (chat._id === chatId) {
              return {
                ...chat,
                latestMessage: data.updatedLatestMessage
              };
            }
            return chat;
          })
        );
      }
      
      return data;
    } catch (err) {
      setError(err.message || 'Failed to delete message');
      throw err;
    }
  };

  const startTyping = (chatId) => {
    if (socket && selectedChat) {
      socket.emit('typing', chatId);
    }
  };

  const stopTyping = (chatId) => {
    if (socket && selectedChat) {
      socket.emit('stop-typing', chatId);
    }
  };

  const getTotalUnreadCount = () => {
    return Object.values(unreadCounts).reduce((sum, count) => sum + count, 0);
  };

  const value = {
    chats,
    selectedChat,
    setSelectedChat,
    messages,
    loading,
    chatLoading,
    messageLoading,
    error,
    typingUsers,
    unreadCounts,
    fetchChats,
    fetchMessages,
    createOrAccessChat,
    createGroupChat: createNewGroupChat,
    createNewGroupChat,
    updateGroupName,
    addUserToGroup,
    removeUserFromGroup,
    leaveGroupChat,
    sendNewMessage,
    markMessageAsRead,
    deleteMessageById,
    startTyping,
    stopTyping,
    getTotalUnreadCount
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};