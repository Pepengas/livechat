import React, { createContext, useState, useEffect, useContext } from 'react';
import {
  loginUser,
  registerUser,
  logoutUser,
  getCurrentUser,
  updateUserProfile,
  uploadAvatar as uploadAvatarApi,
} from '../services/authService';
import { SocketContext } from './SocketContext';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { socket } = useContext(SocketContext);

  useEffect(() => {
    // Check if user is already logged in
    const checkAuthStatus = async () => {
      try {
        const userData = await getCurrentUser();
        if (userData) {
          setCurrentUser(userData);
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Authentication check failed:', err);
        // Clear any invalid tokens
        localStorage.removeItem('token');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const data = await loginUser(email, password);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const data = await registerUser(userData);
      setCurrentUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Logout failed:', err);
      // Force logout on client side even if server request fails
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
    }
  };

  const updateUser = (userData) => {
    setCurrentUser(prevUser => ({
      ...prevUser,
      ...userData
    }));
  };

  const updateProfile = async (fields) => {
    const data = await updateUserProfile(fields);
    setCurrentUser(prev => ({ ...prev, ...data }));
    return data;
  };

  const updateAvatar = async (file) => {
    const data = await uploadAvatarApi(file);
    setCurrentUser(prev => ({ ...prev, avatar: data.avatar }));
    if (socket) {
      socket.emit('avatar-updated', { userId: currentUser._id, avatar: data.avatar });
    }
    return data;
  };

  const value = {
    currentUser,
    isAuthenticated,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    updateProfile,
    updateAvatar,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};