import React, { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { currentUser, isAuthenticated } = useContext(AuthContext);

  useEffect(() => {
    // Only connect socket if user is authenticated
    if (isAuthenticated && currentUser) {
      // Connect to socket server
      // Determine socket server URL. The API URL may include an `/api` path
      // which would be treated as a Socket.IO namespace and cause an
      // "Invalid namespace" error. Strip the trailing `/api` if present.
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';
      const socketUrl = apiUrl.replace(/\/api$/, '');

      const newSocket = io(socketUrl, {
        withCredentials: true,
      });

      // Set up event listeners
      newSocket.on('connect', () => {
        console.log('Socket connected');
        // Register the current user with the server
        newSocket.emit('setup', currentUser);
        // Request the current list of online users
        newSocket.emit('get-online-users', (users) => {
          setOnlineUsers(users);
        });
      });

      newSocket.on('user-online', ({ userId }) => {
        setOnlineUsers((prev) => {
          if (prev.some((u) => u.userId === userId)) return prev;
          return [...prev, { userId }];
        });
      });

      newSocket.on('user-offline', ({ userId }) => {
        setOnlineUsers((prev) => prev.filter((u) => u.userId !== userId));
      });

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });

      // Save socket instance
      setSocket(newSocket);

      // Clean up on unmount
      return () => {
        if (newSocket) {
          newSocket.disconnect();
        }
      };
    }

    // If user logs out, disconnect socket
    return () => {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
    };
  }, [isAuthenticated, currentUser]);

  // Check if a user is online
  const isUserOnline = (userId) => {
    return onlineUsers.some(user => user.userId === userId);
  };

  const value = {
    socket,
    onlineUsers,
    isUserOnline
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};