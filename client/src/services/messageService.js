import api from 'services/apiClient';

/**
 * Get all messages for a chat
 * @param {string} chatId - Chat ID
 * @returns {Promise<Array>} List of messages
 */
export const getMessages = async (chatId) => {
  try {
    const response = await api.get(`/messages/${chatId}`);
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
export const sendMessage = async (
  chatId,
  content,
  attachments = [],
  parentMessageId,
  reply
) => {
  try {
    const payload = { chatId };

    if (content) {
      payload.content = content;
    }

    if (attachments && attachments.length > 0) {
      payload.attachments = attachments;
    }

    if (parentMessageId) {
      payload.parentMessageId = parentMessageId;
    }
    if (reply) {
      if (reply.id) {
        payload.replyToId = reply.id;
      }
      if (reply.snapshot) {
        payload.replyToSnapshot = reply.snapshot;
      }
    }

    const response = await api.post('/messages', payload);

    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to send message' };
  }
};

export const getThread = async (messageId) => {
  try {
    const response = await api.get(`/messages/${messageId}/thread`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to fetch thread' };
  }
};

/**
 * Mark all messages in a chat as read
 * @param {string} chatId - Chat ID
 * @returns {Promise<Object>} Success message
 */
export const markAsRead = async (chatId) => {
  try {
    const response = await api.put(`/messages/read/${chatId}`);
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
export const deleteMessage = async (messageId, scope = 'all') => {
  try {
    const response = await api.delete(
      `/messages/${messageId}?scope=${scope}`
    );
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
    const response = await api.get(`/messages/search/${chatId}?query=${query}`);
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

    const response = await api.post('/messages/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data.attachments;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to upload files' };
  }
};