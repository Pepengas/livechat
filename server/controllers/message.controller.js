const Message = require('../models/message.model');
const User = require('../models/user.model');
const Chat = require('../models/chat.model');
const path = require('path');
const {
  isValidFileType,
  isValidFileSize,
  generateUniqueFilename,
} = require('../utils/fileUpload');

/**
 * @desc    Send a new message
 * @route   POST /api/messages
 * @access  Private
 */
const sendMessage = async (req, res) => {
  try {
    const { content, chatId, attachments = [], parentMessageId } = req.body;

    if (!content && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: 'Message content or attachments are required' });
    }

    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }

    // Normalize newlines but preserve all other whitespace
    const normalizedContent = content ? content.replace(/\r\n/g, '\n') : '';

    // Create a new message
    const newMessage = {
      sender: req.user._id,
      content: normalizedContent,
      chat: chatId,
      attachments,
      readBy: [req.user._id], // Sender has read the message
    };

    if (parentMessageId) {
      newMessage.parentMessage = parentMessageId;
    }

    // Save the message
    let message = await Message.create(newMessage);

    // Populate message with sender and chat details
    message = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('chat');

    // Update the latest message in the chat only for top-level messages
    if (!parentMessageId) {
      await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });
    } else {
      await Message.findByIdAndUpdate(parentMessageId, { $inc: { threadCount: 1 } });
    }
    const messageObj = message.toObject();
    if (parentMessageId) {
      messageObj.parentMessageId = parentMessageId;
    }

    res.status(201).json(messageObj);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get all messages for a chat
 * @route   GET /api/messages/:chatId
 * @access  Private
 */
const getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // Find the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is part of the chat
    if (!chat.users.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    // Get messages for the chat excluding ones deleted for this user or everyone
    const messages = await Message.find({
        chat: chatId,
        parentMessage: null,
        deletedForEveryone: { $ne: true },
        deletedFor: { $ne: req.user._id }
      })
      .populate('sender', 'name email avatar')
      .populate('readBy', 'name email avatar')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get a message thread
 * @route   GET /api/messages/:id/thread
 * @access  Private
 */
const getThread = async (req, res) => {
  try {
    const { id } = req.params;

    const parent = await Message.findById(id)
      .populate('sender', 'name email avatar')
      .populate('readBy', 'name email avatar');

    if (!parent) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const chat = await Chat.findById(parent.chat);
    if (!chat || !chat.users.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this thread' });
    }

    const repliesDocs = await Message.find({
      parentMessage: id,
      deletedForEveryone: { $ne: true },
      deletedFor: { $ne: req.user._id },
    })
      .populate('sender', 'name email avatar')
      .populate('readBy', 'name email avatar')
      .sort({ createdAt: 1 });

    const replies = repliesDocs.map((m) => ({ ...m.toObject(), parentMessageId: id }));

    res.json({ parent, replies });
  } catch (error) {
    console.error('Get thread error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Mark messages as read
 * @route   PUT /api/messages/read/:chatId
 * @access  Private
 */
const markAsRead = async (req, res) => {
  try {
    const { chatId } = req.params;
    
    // Find the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is part of the chat
    if (!chat.users.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to mark these messages as read' });
    }

    // Mark all unread messages as read
    const result = await Message.updateMany(
      { 
        chat: chatId, 
        readBy: { $ne: req.user._id } 
      },
      { 
        $addToSet: { readBy: req.user._id } 
      }
    );

    res.json({ message: 'Messages marked as read', count: result.nModified });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Delete a message
 * @route   DELETE /api/messages/:id
 * @access  Private
 */
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const { scope } = req.query; // 'me' or 'all'

    // Find the message
    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (scope === 'me') {
      // Mark as deleted for this user only
      if (!message.deletedFor.includes(req.user._id)) {
        message.deletedFor.push(req.user._id);
        await message.save();
      }
      return res.json({ message: 'Message deleted for you' });
    }

    // Delete for everyone
    await Message.findByIdAndDelete(id);

    const chat = await Chat.findById(message.chat);
    let updatedLatestMessage = null;
    if (chat.latestMessage && chat.latestMessage.toString() === id) {
      const latestMessage = await Message.findOne({
        chat: message.chat,
        deletedForEveryone: { $ne: true }
      })
        .sort({ createdAt: -1 })
        .populate('sender', 'name email avatar')
        .populate('readBy', 'name email avatar');

      await Chat.findByIdAndUpdate(message.chat, {
        latestMessage: latestMessage ? latestMessage._id : null,
      });
      updatedLatestMessage = latestMessage;
    }

    res.json({ message: 'Message deleted for everyone', updatedLatestMessage });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Search messages in a chat
 * @route   GET /api/messages/search/:chatId
 * @access  Private
 */
const searchMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Find the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    
    // Check if user is part of the chat
    if (!chat.users.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to search these messages' });
    }

    // Search messages
    const messages = await Message.find({
      chat: chatId,
      content: { $regex: query, $options: 'i' },
    })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 });

    res.json(messages);
  } catch (error) {
    console.error('Search messages error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Upload message attachments
 * @route   POST /api/messages/upload
 * @access  Private
 */
const uploadAttachments = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    // Convert files to Base64 data URLs so they persist in the database
    const attachments = req.files.map((file) => ({
      type: file.mimetype,
      url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      name: file.originalname,
      size: file.size,
    }));

    res.status(201).json({ attachments });
  } catch (error) {
    console.error('Upload attachments error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  getThread,
  searchMessages,
  uploadAttachments,
};