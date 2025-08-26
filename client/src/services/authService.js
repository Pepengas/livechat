import api from 'services/apiClient';
import {
  setTokens,
  clearTokens,
} from 'services/tokenService';

/**
 * Register a new user
 * @param {Object} userData - User data (name, email, password)
 * @returns {Promise<Object>} User data and token
 */
export const registerUser = async (userData) => {
  try {
    const { data } = await api.post('/auth/register', userData);
    if (data.accessToken || data.token) {
      setTokens(data.accessToken || data.token, data.refreshToken);
    }
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Registration failed' };
  }
};

/**
 * Login a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User data and token
 */
export const loginUser = async (email, password) => {
  try {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.accessToken || data.token) {
      setTokens(data.accessToken || data.token, data.refreshToken);
    }
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Login failed' };
  }
};

/**
 * Logout the current user
 * @returns {Promise<void>}
 */
export const logoutUser = async () => {
  try {
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
    throw error.response?.data || { message: 'Logout failed' };
  } finally {
    clearTokens();
  }
};

/**
 * Get the current user's profile
 * @returns {Promise<Object>} User data
 */
export const getCurrentUser = async () => {
  try {
    const { data } = await api.get('/auth/profile');
    return data;
  } catch (error) {
    if (error.response?.status === 401) {
      clearTokens();
    }
    throw error.response?.data || { message: 'Failed to get user profile' };
  }
};

/**
 * Update the current user's profile
 * @param {Object} userData - Updated user data
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserProfile = async (userData) => {
  try {
    const { data } = await api.put('/auth/profile', userData);
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update profile' };
  }
};

/**
 * Upload user avatar
 * @param {File} file - Image file
 * @returns {Promise<Object>} Updated user data with avatar URL
 */
export const uploadAvatar = async (file) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);

    const { data } = await api.post('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to upload avatar' };
  }
};

/**
 * Reset a user's password using email and a new password
 * @param {string} email - User email
 * @param {string} newPassword - New password to set
 * @returns {Promise<Object>} Response message
 */
export const resetPassword = async (email, newPassword) => {
  try {
    const { data } = await api.post('/auth/forgot-password', {
      email,
      newPassword,
    });
    return data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to reset password' };
  }
};