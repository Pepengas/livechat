import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { getChats, accessChat, createGroupChat, renameGroup, addToGroup, removeFromGroup, leaveGroup } from '../services/chatService';
import { getMessages, sendMessage, markAsRead, deleteMessage, getThread, getMessageById } from '../services/messageService';
import { AuthContext } from './AuthContext';
import { SocketContext } from './SocketContext';
import api from 'services/apiClient';
import { mergeMessages } from '../utils/messagePagination';


const hasUser = (arr, userId) =>
  Array.isArray(arr) && arr.some((u) => (u.user?._id || u.user || u.userId) === userId);

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const { currentUser, isAuthenticated } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageCache, setMessageCache] = useState({});
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [messageLoading, setMessageLoading] = useState(false);
  const [error, setError] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [lastReadAtMap, setLastReadAtMap] = useState({});
  const [activeThreadParent, setActiveThreadParent] = useState(null);
  const [threadMessages, setThreadMessages] = useState([]);
  const [replyTo, setReplyTo] = useState(null);
  const [userSearchCache, setUserSearchCache] = useState({});
  const [chatSearchCache, setChatSearchCache] = useState({});
  const [pagination, setPagination] = useState({});
  const [loadingMore, setLoadingMore] = useState(false);
  const messageControllerRef = useRef(null);
  const replyCache = useRef({});

  const updateMessageReactions = (messageId, reactions) => {
    setMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)));
    setMessageCache((prev) => {
      const updated = {};
      for (const [chatId, msgs] of Object.entries(prev)) {
        updated[chatId] = msgs.map((m) => (m._id === messageId ? { ...m, reactions } : m));
      }
      return updated;
    });
    setThreadMessages((prev) => prev.map((m) => (m._id === messageId ? { ...m, reactions } : m)));
    if (activeThreadParent && activeThreadParent._id === messageId) {
      setActiveThreadParent((prev) => ({ ...prev, reactions }));
    }
  };

  const startReply = (message) => {
    setReplyTo(message);
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const buildReplyData = (msg) => {
    if (!msg) return undefined;
    const att = msg.attachments?.[0];
    let type = 'text';
    let excerpt = (msg.content || msg.text || '').slice(0, 120);
    let thumbUrl;
    if (att) {
      if (att.type?.startsWith('image/')) {
        type = 'image';
        excerpt = 'Photo';
        thumbUrl = att.url;
      } else if (att.type?.startsWith('audio/')) {
        type = 'audio';
        excerpt = 'Audio';
      } else {
        type = 'file';
        excerpt = att.name?.slice(0, 120) || 'File';
      }
    }
    return {
      id: msg._id || msg.id,
      snapshot: {
        senderId: msg.sender?._id || msg.senderId,
        senderName: msg.sender?.name || 'Unknown',
        type,
        excerpt,
        thumbUrl,
        createdAt: msg.createdAt,
      },
    };
  };

  const hydrateReplies = async (msgs) => {
    const toFetch = [];

    // First pass: determine which reply IDs need fetching or caching
    for (const m of msgs) {
      if (!m.replyTo) continue;
      const id = m.replyTo.id;

      if (m.replyTo.senderName && m.replyTo.excerpt) {
        // Message already contains snapshot data; cache it for future use
        replyCache.current[id] = { ...m.replyTo };
        continue;
      }

      const cached = replyCache.current[id];
      if (cached) {
        // Use cached data when available
        m.replyTo = { id, ...cached };
        continue;
      }

      // Collect IDs that need to be hydrated
      if (!toFetch.includes(id)) {
        toFetch.push(id);
      }
    }

    // Fetch all missing replies in parallel
    if (toFetch.length) {
      const results = await Promise.all(
        toFetch.map((id) =>
          getMessageById(id)
            .then((ref) => ({ id, data: buildReplyData(ref)?.snapshot || {} }))
            .catch(() => ({ id, data: { isUnavailable: true } }))
        )
      );

      results.forEach(({ id, data }) => {
        replyCache.current[id] = data;
      });
    }

    // Second pass: populate messages with hydrated data
    for (const m of msgs) {
      if (!m.replyTo) continue;
      const id = m.replyTo.id;
      const cached = replyCache.current[id];

      if (cached) {
        m.replyTo = { id, ...cached };
      } else if (!m.replyTo.senderName && !m.replyTo.excerpt) {
        m.replyTo = { id, isUnavailable: true };
        replyCache.current[id] = { isUnavailable: true };
      }
    }
  };

  // Exit reply mode when switching chats
  useEffect(() => {
    setReplyTo(null);
  }, [selectedChat?._id]);

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
    socket.on('message-received', async (newMessage) => {
      await hydrateReplies([newMessage]);
      // Update messages if in the same chat
      if (selectedChat && selectedChat._id === newMessage.chat._id) {
        setMessages((prev) =>
          prev.some((m) => m._id === newMessage._id)
            ? prev
            : [...prev, newMessage]
        );
      } else {
        // Update unread count for this chat
        setUnreadCounts((prev) => ({
          ...prev,
          [newMessage.chat._id]: (prev[newMessage.chat._id] || 0) + 1,
        }));
      }

      setMessageCache((prev) => {
        const existing = prev[newMessage.chat._id] || [];
        if (existing.some((m) => m._id === newMessage._id)) return prev;
        return {
          ...prev,
          [newMessage.chat._id]: [...existing, newMessage],
        };
      });

      if (newMessage.sender._id !== currentUser._id) {
        socket.emit('ack-delivery', { messageId: newMessage._id });
      }

      // Update chat list to show latest message
      setChats((prevChats) => {
        const updatedChat = {
          ...newMessage.chat,
          latestMessage: newMessage,
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

      setMessageCache((prev) => {
        const { [chatId]: _, ...rest } = prev;
        return rest;
      });
    });

    // Message deleted
    socket.on('message:deleted', ({ messageId, chatId, newLatestMessage }) => {
      // Update messages if in the same chat
      if (selectedChat && selectedChat._id === chatId) {
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg._id !== messageId)
        );
      }

      setMessageCache((prev) => ({
        ...prev,
        [chatId]: (prev[chatId] || []).filter(
          (msg) => msg._id !== messageId
        ),
      }));

      if (replyTo && (replyTo._id === messageId || replyTo.id === messageId)) {
        setReplyTo((prev) =>
          prev ? { ...prev, content: '', text: '', isUnavailable: true } : prev
        );
      }

      // Update chat list with new latest message
      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat._id === chatId) {
            return {
              ...chat,
              latestMessage: newLatestMessage,
            };
          }
          return chat;
        });
      });
    });

    // Message delivered
    socket.on('message-delivered', ({ messageId, deliveredTo, deliveredAll }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? { ...m, deliveredTo, status: deliveredAll ? 'delivered_all' : m.status }
            : m
        )
      );
      setMessageCache((prev) => {
        const updated = {};
        for (const [cid, msgs] of Object.entries(prev)) {
          updated[cid] = msgs.map((m) =>
            m._id === messageId
              ? { ...m, deliveredTo, status: deliveredAll ? 'delivered_all' : m.status }
              : m
          );
        }
        return updated;
      });
      setChats((prev) =>
        prev.map((chat) =>
          chat.latestMessage && chat.latestMessage._id === messageId
            ? {
                ...chat,
                latestMessage: {
                  ...chat.latestMessage,
                  deliveredTo,
                  status: deliveredAll
                    ? 'delivered_all'
                    : chat.latestMessage.status,
                },
              }
            : chat
        )
      );
    });

    // Message read
    socket.on('message-read', ({ messageId, readerId, at, readAll }) => {
      setMessages((prev) =>
        prev.map((m) =>
          m._id === messageId
            ? {
                ...m,
                readBy: hasUser(m.readBy, readerId)
                  ? m.readBy
                  : [...m.readBy, { user: { _id: readerId }, at }],
                status: readAll ? 'read_all' : m.status,
              }
            : m
        )
      );
      setMessageCache((prev) => {
        const updated = {};
        for (const [cid, msgs] of Object.entries(prev)) {
          updated[cid] = msgs.map((m) =>
            m._id === messageId
              ? {
                  ...m,
                  readBy: hasUser(m.readBy, readerId)
                    ? m.readBy
                    : [...m.readBy, { user: { _id: readerId }, at }],
                  status: readAll ? 'read_all' : m.status,
                }
              : m
          );
        }
     return updated;
      });
      setChats((prev) =>
        prev.map((chat) => {
          if (chat.latestMessage && chat.latestMessage._id === messageId) {
            const existing = chat.latestMessage.readBy || [];
            const already = hasUser(existing, readerId);
            return {
              ...chat,
              latestMessage: {
                ...chat.latestMessage,
                readBy: already
                  ? existing
                  : [...existing, { user: { _id: readerId }, at }],
                status: readAll
                  ? 'read_all'
                  : chat.latestMessage.status,
              },
            };
          }
          return chat;
        })
      );
    });

    // User avatar updated
    socket.on('user-avatar-updated', ({ userId, avatar }) => {
      setChats((prevChats) =>
        prevChats.map((chat) => ({
          ...chat,
          users: chat.users.map((u) =>
            u._id === userId ? { ...u, avatar } : u
          ),
          latestMessage:
            chat.latestMessage &&
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

      setMessageCache((prev) => {
        const updated = {};
        for (const [chatId, msgs] of Object.entries(prev)) {
          updated[chatId] = msgs.map((m) =>
            m.sender._id === userId
              ? { ...m, sender: { ...m.sender, avatar } }
              : m
          );
        }
        return updated;
      });
    });

    socket.on('message:reactionUpdated', ({ messageId, reactions }) => {
      updateMessageReactions(messageId, reactions);
    });

    socket.on('thread:messageCreated', (newMessage) => {
      if (activeThreadParent && newMessage.parentMessageId === activeThreadParent._id) {
        setThreadMessages((prev) => [...prev, newMessage]);
        setMessages((prev) =>
          prev.map((m) =>
            m._id === newMessage.parentMessageId
              ? { ...m, threadCount: (m.threadCount || 0) + 1 }
              : m
          )
        );
        setMessageCache((prev) => ({
          ...prev,
          [newMessage.chat._id]: (prev[newMessage.chat._id] || []).map((m) =>
            m._id === newMessage.parentMessageId
              ? { ...m, threadCount: (m.threadCount || 0) + 1 }
              : m
          ),
        }));
      } else {
        setMessages((prev) =>
          prev.map((m) =>
            m._id === newMessage.parentMessageId
              ? { ...m, threadCount: (m.threadCount || 0) + 1 }
              : m
          )
        );
        setMessageCache((prev) => ({
          ...prev,
          [newMessage.chat._id]: (prev[newMessage.chat._id] || []).map((m) =>
            m._id === newMessage.parentMessageId
              ? { ...m, threadCount: (m.threadCount || 0) + 1 }
              : m
          ),
        }));
      }
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
      socket.off('message:reactionUpdated');
      socket.off('thread:messageCreated');
    };
  }, [socket, selectedChat, currentUser, activeThreadParent, replyTo]);

  const fetchChats = async () => {
    setChatLoading(true);
    setError(null);
    try {
      const data = await getChats();
      setChats(data.map(chat => ({
        ...chat,
        lastReadAt: lastReadAtMap[chat._id] || chat.lastReadAt || null,
      })));
      
      // Initialize unread counts
      const counts = {};
      data.forEach(chat => {
        const unreadMessages =
          chat.latestMessage &&
          chat.latestMessage.sender._id !== currentUser._id &&
          !hasUser(chat.latestMessage.readBy, currentUser._id)
            ? 1
            : 0;
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
    if (messageControllerRef.current) {
      messageControllerRef.current.abort();
    }
    messageControllerRef.current = new AbortController();
    const cached = messageCache[chatId];
    if (cached) {
      setMessages(cached);
    } else {
      setMessages([]);
    }
    setMessageLoading(!cached);
    setError(null);
    try {
      const { items, hasMore, nextCursor } = await getMessages(
        chatId,
        { limit: 20 },
        { signal: messageControllerRef.current.signal }
      );
      const data = items.slice().reverse();
      await hydrateReplies(data);
      setMessages(data);
      setMessageCache((prev) => ({ ...prev, [chatId]: data }));
      setPagination((prev) => ({ ...prev, [chatId]: { hasMore, nextCursor } }));
      data.forEach((m) => {
        if (socket && m.sender._id !== currentUser._id) {
          socket.emit('ack-delivery', { messageId: m._id });
        }
      });
      const lastReadMsg = [...data]
        .reverse()
        .find((m) => hasUser(m.readBy, currentUser._id));
      const lastReadAt = lastReadMsg
        ? new Date(lastReadMsg.createdAt)
        : new Date(0);
      setLastReadAtMap((prev) => ({ ...prev, [chatId]: lastReadAt }));
      setSelectedChat((prev) =>
        prev && prev._id === chatId ? { ...prev, lastReadAt } : prev
      );
      setChats((prev) =>
        prev.map((c) => (c._id === chatId ? { ...c, lastReadAt } : c))
      );
      return data;
    } catch (err) {
      setError(err.message || 'Failed to fetch messages');
      return cached || [];
    } finally {
      setMessageLoading(false);
    }
  };

  const loadOlderMessages = async (chatId) => {
    const page = pagination[chatId];
    if (!page?.hasMore || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const { items, hasMore, nextCursor } = await getMessages(
        chatId,
        { limit: 20, before: page.nextCursor },
        { signal: messageControllerRef.current?.signal }
      );
      const data = items.slice().reverse();
      await hydrateReplies(data);
      setMessages((prev) => mergeMessages(prev, data));
      setMessageCache((prev) => ({
        ...prev,
        [chatId]: mergeMessages(prev[chatId] || [], data),
      }));
      setPagination((prev) => ({
        ...prev,
        [chatId]: { hasMore, nextCursor },
      }));
    } catch (err) {
      setError(err.message || 'Failed to fetch messages');
    } finally {
      setLoadingMore(false);
    }
  };

  const ensureMessageLoaded = async (messageId) => {
    if (!selectedChat) return false;
    if (messages.some((m) => m._id === messageId)) return true;
    while (pagination[selectedChat._id]?.hasMore) {
      await loadOlderMessages(selectedChat._id);
      if ((messageCache[selectedChat._id] || []).some((m) => m._id === messageId)) {
        setMessages([...messageCache[selectedChat._id]]);
        return true;
      }
    }
    return false;
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

      setMessageCache((prev) => {
        const { [chatId]: _, ...rest } = prev;
        return rest;
      });
    } catch (err) {
      setError(err.message || 'Failed to leave group');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const sendNewMessage = async (chatId, content, attachments = [], reply) => {
    setError(null);
    try {
      const replyData = buildReplyData(reply);
      const data = await sendMessage(chatId, content, attachments, undefined, replyData);
      await hydrateReplies([data]);

      if (socket) {
        socket.emit('new-message', data);
        console.log('Emitted new-message', data);
      }

      // Add message to current chat
      setMessages([...messages, data]);
      setMessageCache((prev) => ({
        ...prev,
        [chatId]: [...(prev[chatId] || []), data],
      }));
      
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
      
      setReplyTo(null);
      return data;
    } catch (err) {
      setError(err.message || 'Failed to send message');
      throw err;
    }
  };

  const openThread = async (message) => {
    setActiveThreadParent(message);
    try {
      const data = await getThread(message._id || message.id);
      setActiveThreadParent(data.parent);
      setThreadMessages(data.replies);
    } catch (err) {
      console.error('Failed to fetch thread:', err);
      setThreadMessages([]);
    }
  };

  const closeThread = () => {
    setActiveThreadParent(null);
    setThreadMessages([]);
  };

  const sendThreadMessage = async (text) => {
    if (!activeThreadParent) return;
    setError(null);
    try {
      const msg = await sendMessage(
        selectedChat._id,
        text,
        [],
        activeThreadParent._id
      );
      setThreadMessages((prev) => [...prev, msg]);
      setMessages((prev) =>
        prev.map((m) =>
          m._id === activeThreadParent._id
            ? { ...m, threadCount: (m.threadCount || 0) + 1 }
            : m
        )
      );
      setMessageCache((prev) => ({
        ...prev,
        [selectedChat._id]: (prev[selectedChat._id] || []).map((m) =>
          m._id === activeThreadParent._id
            ? { ...m, threadCount: (m.threadCount || 0) + 1 }
            : m
        ),
      }));
      if (socket) {
        socket.emit('new-thread-message', msg);
      }
      return msg;
    } catch (err) {
      console.error('Failed to send thread message:', err);
      throw err;
    }
  };

  const markMessageAsRead = async (chatId) => {
    try {
      await markAsRead(chatId);

      const last = (messageCache[chatId] || messages).slice(-1)[0];
      if (socket && last) {
        socket.emit('ack-read-up-to', { conversationId: chatId, messageId: last._id });
      }

      // Clear unread count for this chat
      setUnreadCounts(prev => ({
        ...prev,
        [chatId]: 0
      }));

      const now = new Date();
      setLastReadAtMap(prev => ({ ...prev, [chatId]: now }));
      setSelectedChat(prev =>
        prev && prev._id === chatId ? { ...prev, lastReadAt: now } : prev
      );
      setChats(prev =>
        prev.map(c => (c._id === chatId ? { ...c, lastReadAt: now } : c))
      );

      // Update read status in messages
      if (selectedChat && selectedChat._id === chatId) {
        setMessages(prevMessages => {
          const updated = prevMessages.map(msg => ({
            ...msg,
            readBy: hasUser(msg.readBy, currentUser._id)
              ? msg.readBy
              : [...msg.readBy, { user: { _id: currentUser._id }, at: now }],
          }));
          setMessageCache(prev => ({ ...prev, [chatId]: updated }));
          return updated;
        });
      } else {
        setMessageCache(prev => ({
          ...prev,
          [chatId]: (prev[chatId] || []).map(msg =>
            hasUser(msg.readBy, currentUser._id)
              ? msg
              : { ...msg, readBy: [...msg.readBy, { user: { _id: currentUser._id }, at: now }] }
          ),
        }));
      }
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const deleteMessageById = async (messageId, chatId, scope = 'all') => {
    setError(null);
    try {
      const data = await deleteMessage(messageId, scope);

      setMessages(prevMessages => {
        const updated = prevMessages.filter(msg => msg._id !== messageId);
        setMessageCache(prev => ({ ...prev, [chatId]: updated }));

        if (scope === 'me') {
          const latest = updated[updated.length - 1] || null;
          setChats(prevChats =>
            prevChats.map(chat =>
              chat._id === chatId ? { ...chat, latestMessage: latest } : chat
            )
          );
        }

        return updated;
      });

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

  const searchUsersCached = async (query) => {
    if (!query) return [];
    if (userSearchCache[query]) return userSearchCache[query];
    try {
      const { data } = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
      setUserSearchCache((prev) => ({ ...prev, [query]: data }));
      return data;
    } catch (err) {
      console.error('Failed to search users:', err);
      return [];
    }
  };

  const searchChatsCached = async (query) => {
    if (!query) return [];
    if (chatSearchCache[query]) return chatSearchCache[query];
    try {
      const { data } = await api.get(`/chats/search?q=${encodeURIComponent(query)}`);
      setChatSearchCache((prev) => ({ ...prev, [query]: data }));
      return data;
    } catch (err) {
      console.error('Failed to search chats:', err);
      return [];
    }
  };

  const toggleReaction = async (messageId, emoji) => {
    let target = messages.find((m) => m._id === messageId);
    if (!target) {
      for (const msgs of Object.values(messageCache)) {
        const found = msgs.find((m) => m._id === messageId);
        if (found) {
          target = found;
          break;
        }
      }
    }
    if (!target) return;
    const existing = target.reactions || [];
    const hasReacted = existing.some(
      (r) => r.emoji === emoji && r.userId === currentUser._id
    );
    const reactions = hasReacted
      ? existing.filter(
          (r) => !(r.emoji === emoji && r.userId === currentUser._id)
        )
      : [...existing, { emoji, userId: currentUser._id }];
    updateMessageReactions(messageId, reactions);
    try {
      await api.post(`/messages/${messageId}/reactions`, { emoji });
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
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
    activeThreadParent,
    threadMessages,
    replyTo,
    openThread,
    closeThread,
    sendThreadMessage,
    fetchChats,
    fetchMessages,
    loadOlderMessages,
    ensureMessageLoaded,
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
    toggleReaction,
    startTyping,
    stopTyping,
    getTotalUnreadCount,
    currentUser,
    loadingMore,
    pagination,
    startReply,
    cancelReply,
    searchUsers: searchUsersCached,
    searchChats: searchChatsCached
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
