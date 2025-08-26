import api from 'services/apiClient';

/**
 * Get all chats for the current user
 * @returns {Promise<Array>} List of chats
 */
export const getChats = async () => {
  try {
    const response = await api.get('/chats');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch chats' };
  }
};

/**
 * Create or access a one-to-one chat with another user
 * @param {string} userId - ID of the user to chat with
 * @returns {Promise<Object>} Chat data
 */
export const accessChat = async (userId) => {
  try {
    const response = await api.post('/chats', { userId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to access chat' };
  }
};

/**
 * Create a new group chat
 * @param {Array} users - Array of user IDs
 * @param {string} name - Group name
 * @param {File} avatar - Optional group avatar
 * @returns {Promise<Object>} Group chat data
 */
export const createGroupChat = async (users, name) => {
  try {
    const response = await api.post('/chats/group', {
      name,
      users,
    });

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to create group chat' };
  }
};

/**
 * Rename a group chat
 * @param {string} chatId - Chat ID
 * @param {string} name - New group name
 * @returns {Promise<Object>} Updated group chat data
 */
export const renameGroup = async (chatId, name) => {
  try {
    const response = await api.put(`/chats/group/${chatId}`, { name });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to rename group' };
  }
};

/**
 * Add a user to a group chat
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID to add
 * @returns {Promise<Object>} Updated group chat data
 */
export const addToGroup = async (chatId, userId) => {
  try {
    const response = await api.put(`/chats/group/${chatId}/add`, { userId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to add user to group' };
  }
};

/**
 * Remove a user from a group chat
 * @param {string} chatId - Chat ID
 * @param {string} userId - User ID to remove
 * @returns {Promise<Object>} Updated group chat data
 */
export const removeFromGroup = async (chatId, userId) => {
  try {
    const response = await api.put(`/chats/group/${chatId}/remove`, { userId });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to remove user from group' };
  }
};

/**
 * Leave a group chat
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object>} Success message
 */
export const leaveGroup = async (chatId) => {
  try {
    const response = await api.put(`/chats/group/${chatId}/leave`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to leave group' };
  }
};

/**
 * Update group avatar
 * @param {string} chatId - Chat ID
 * @param {File} avatar - Group avatar file
 * @returns {Promise<Object>} Updated group chat data
 */
export const updateGroupAvatar = async (chatId, avatar) => {
  try {
    const formData = new FormData();
    formData.append('chatId', chatId);
    formData.append('avatar', avatar);
    
    const response = await api.put('/chats/group/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update group avatar' };
  }
};