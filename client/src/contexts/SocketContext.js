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
      const newSocket = io(process.env.REACT_APP_API_URL || 'http://localhost:5000', {
        withCredentials: true,
      });

      // Set up event listeners
      newSocket.on('connect', () => {
        console.log('Socket connected');
        // Emit user connected event with user info
        newSocket.emit('user:connected', { userId: currentUser._id });
      });

      newSocket.on('users:online', (users) => {
        setOnlineUsers(users);
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