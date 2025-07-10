import axios, { API_URL } from './apiConfig';

/**
 * Get all messages for a chat
 * @param {string} chatId - Chat ID
 * @returns {Promise<Array>} List of messages
 */
export const getMessages = async (chatId) => {
  try {
    const response = await axios.get(`${API_URL}/messages/${chatId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch messages' };
  }
};

/**
 * Send a new message
 * @param {string} chatId - Chat ID
 * @param {string} content - Message content
 * @param {Array} attachments - Optional array of attachment files
 * @returns {Promise<Object>} Created message
 */
export const sendMessage = async (chatId, content, attachments = []) => {
  try {
    const payload = { chatId };

    if (content) {
      payload.content = content;
    }

    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }

    const response = await axios.post(`${API_URL}/messages`, payload);

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to send message' };
  }
};

/**
 * Mark all messages in a chat as read
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object>} Success message
 */
export const markAsRead = async (chatId) => {
  try {
    const response = await axios.put(`${API_URL}/messages/read/${chatId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to mark messages as read' };
  }
};

/**
 * Delete a message
 * @param {string} messageId - Message ID
 * @returns {Promise<Object>} Success message and updated latest message
 */
export const deleteMessage = async (messageId) => {
  try {
    const response = await axios.delete(`${API_URL}/messages/${messageId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete message' };
  }
};

/**
 * Search messages in a chat
 * @param {string} chatId - Chat ID
 * @param {string} query - Search query
 * @returns {Promise<Array>} List of matching messages
 */
export const searchMessages = async (chatId, query) => {
  try {
    const response = await axios.get(`${API_URL}/messages/search/${chatId}?query=${query}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to search messages' };
  }
};

export const uploadAttachments = async (files) => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await axios.post(`${API_URL}/messages/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.attachments;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to upload files' };
  }
};