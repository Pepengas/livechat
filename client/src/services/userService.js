import api from '@/services/apiClient';

/**
 * Get all users
 * @returns {Promise<Array>} List of users
 */
export const getAllUsers = async () => {
  try {
    const response = await api.get('/users');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch users' };
  }
};

/**
 * Get a user by ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} User data
 */
export const getUserById = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch user' };
  }
};

/**
 * Search users by name or email
 * @param {string} query - Search query
 * @returns {Promise<Array>} List of matching users
 */
export const searchUsers = async (query) => {
  try {
    const response = await api.get(`/users/search?query=${query}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search users' };
  }
};

/**
 * Update user status
 * @param {string} status - New status (online, away, busy, offline)
 * @returns {Promise<Object>} Updated user data
 */
export const updateUserStatus = async (status) => {
  try {
    const response = await api.put('/users/status', { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update status' };
  }
};