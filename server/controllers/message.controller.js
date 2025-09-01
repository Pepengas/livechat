const Message = require('../models/message.model');
const User = require('../models/user.model');
const Chat = require('../models/chat.model');
const Reaction = require('../models/reaction.model');
const ConversationParticipant = require('../models/conversationParticipant.model');
const path = require('path');
const {
  isValidFileType,
  isValidFileSize,
  generateUniqueFilename,
} = require('../utils/fileUpload');

// Convert a Message mongoose document or plain object to a plain object
// including the combined `replyTo` field expected by the client.
const formatMessage = (doc) => {
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };
  if (obj.replyToId || obj.replyToSnapshot) {
    obj.replyTo = {
      id: obj.replyToId ? obj.replyToId.toString() : undefined,
      ...(obj.replyToSnapshot || {}),
    };
  }
  delete obj.replyToId;
  delete obj.replyToSnapshot;
  return obj;
};

/**
 * @desc    Send a new message
 * @route   POST /api/messages
 * @access  Private
 */
const sendMessage = async (req, res) => {
  try {
    const {
      content,
      chatId,
      attachments = [],
      parentMessageId,
      replyToId,
      replyToSnapshot,
    } = req.body;

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
      status: 'sent',
      deliveredTo: [],
      readBy: [{ user: req.user._id, at: new Date() }],
    };

    if (parentMessageId) {
      newMessage.parentMessage = parentMessageId;
    }
    if (replyToId) {
      newMessage.replyToId = replyToId;
    }
    if (replyToSnapshot) {
      newMessage.replyToSnapshot = replyToSnapshot;
    }

    // Save the message
    let message = await Message.create(newMessage);

    // Populate message with sender and chat details
    message = await Message.findById(message._id)
      .populate('sender', 'name email avatar')
      .populate('chat')
      .populate('readBy.user', 'name email avatar')
      .populate('deliveredTo.user', 'name email avatar');

    // Update the latest message in the chat only for top-level messages
    if (!parentMessageId) {
      await Chat.findByIdAndUpdate(chatId, { latestMessage: message._id });
    } else {
      await Message.findByIdAndUpdate(parentMessageId, { $inc: { threadCount: 1 } });
    }
    let messageObj = formatMessage(message);
    if (parentMessageId) {
      messageObj.parentMessageId = parentMessageId;
    }
    messageObj.reactions = [];

    res.status(201).json(messageObj);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get all messages for a chat
 * @route   GET /api/messages?chatId={chatId}
 * @access  Private
 */
const getMessages = async (req, res) => {
  try {
    const { chatId, limit = 20, before } = req.query;

    if (!chatId) {
      return res.status(400).json({ message: 'chatId is required' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!chat.users.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view these messages' });
    }

    const q = {
      chat: chatId,
      parentMessage: null,
      deletedForEveryone: { $ne: true },
      deletedFor: { $ne: req.user._id }
    };

    if (before) {
      const [createdAt, id] = before.split('_');
      q.$or = [
        { createdAt: { $lt: new Date(createdAt) } },
        { createdAt: new Date(createdAt), _id: { $lt: id } }
      ];
    }

    const limitNum = parseInt(limit);
   const docs = await Message.aggregate([
      { $match: q },
      { $sort: { createdAt: -1, _id: -1 } },
      { $limit: limitNum + 1 },
      {
        $lookup: {
          from: 'reactions',
          localField: '_id',
          foreignField: 'message',
          as: 'reactions',
        },
      },
    ]);

    await Message.populate(docs, [
      { path: 'sender', select: 'name email avatar' },
      { path: 'readBy.user', select: 'name email avatar' },
      { path: 'deliveredTo.user', select: 'name email avatar' },
    ]);

    const hasMore = docs.length > limitNum;
    const items = hasMore ? docs.slice(0, -1) : docs;

    const messages = items.map((m) => ({
      ...formatMessage(m),
      reactions: (m.reactions || []).map((r) => ({
        emoji: r.emoji,
        userId: r.user.toString(),
      })),
    }));

    let nextCursor = null;
    if (hasMore) {
      const last = items[items.length - 1];
      nextCursor = `${new Date(last.createdAt).toISOString()}_${last._id.toString()}`;
    }

    res.json({ items: messages, hasMore, nextCursor });
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
      .populate('readBy.user', 'name email avatar')
      .populate('deliveredTo.user', 'name email avatar');

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
      .populate('readBy.user', 'name email avatar')
      .populate('deliveredTo.user', 'name email avatar')
      .sort({ createdAt: 1 });

    const ids = [parent._id, ...repliesDocs.map((m) => m._id)];
    const reactions = await Reaction.find({ message: { $in: ids } });
    const map = {};
    reactions.forEach((r) => {
      const key = r.message.toString();
      if (!map[key]) map[key] = [];
      map[key].push({ emoji: r.emoji, userId: r.user.toString() });
    });

    const replies = repliesDocs.map((m) => ({
      ...formatMessage(m),
      reactions: map[m._id.toString()] || [],
      parentMessageId: id,
    }));
    const parentWithReactions = {
      ...formatMessage(parent),
      reactions: map[parent._id.toString()] || [],
    };

    res.json({ parent: parentWithReactions, replies });
  } catch (error) {
    console.error('Get thread error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Toggle a reaction on a message
 * @route   POST /api/messages/:id/reactions
 * @access  Private
 */
const toggleReaction = async (req, res) => {
  try {
    const { id } = req.params;
    const { emoji } = req.body;
    if (!emoji) {
      return res.status(400).json({ message: 'Emoji is required' });
    }

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const existing = await Reaction.findOne({
      message: id,
      user: req.user._id,
      emoji,
    });

    if (existing) {
      await existing.deleteOne();
    } else {
      await Reaction.create({ message: id, user: req.user._id, emoji });
    }

    const reactionsDocs = await Reaction.find({ message: id });
    const reactions = reactionsDocs.map((r) => ({
      emoji: r.emoji,
      userId: r.user.toString(),
    }));

    const io = req.app.get('io');
    if (io) {
      io.to(message.chat.toString()).emit('message:reactionUpdated', {
        messageId: id,
        reactions,
      });
    }

    res.json({ messageId: id, reactions });
  } catch (error) {
    console.error('Toggle reaction error:', error);
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
        'readBy.user': { $ne: req.user._id }
      },
      {
        $push: { readBy: { user: req.user._id, at: new Date() } }
      }
    );

    res.json({ message: 'Messages marked as read', count: result.nModified });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const ackDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    let message = await Message.findById(id).populate('chat');
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    if (message.sender.toString() === userId.toString()) {
      return res.status(400).json({ message: 'Sender cannot ack delivery' });
    }
    const exists = message.deliveredTo.find((d) => d.user.toString() === userId.toString());
    if (!exists) {
      message.deliveredTo.push({ user: userId, at: new Date() });
    }
    const chat = await Chat.findById(message.chat).select('users');
    const recipients = chat.users.filter(
      (u) => u.toString() !== message.sender.toString()
    );
    let deliveredAll = false;
    if (message.deliveredTo.length >= recipients.length) {
      deliveredAll = true;
      if (message.status === 'sent') message.status = 'delivered_all';
    }
    await message.save();
    const io = req.app.get('io');
    io.to(chat._id.toString()).emit('message-delivered', {
      messageId: message._id,
      deliveredTo: message.deliveredTo,
      deliveredAll,
    });
    res.json({ messageId: message._id, deliveredTo: message.deliveredTo, deliveredAll });
  } catch (error) {
    console.error('Ack delivery error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const ackRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    let message = await Message.findById(id).populate('chat');
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    if (message.sender.toString() === userId.toString()) {
      return res.status(400).json({ message: 'Sender cannot ack read' });
    }
    const now = new Date();
    const exists = message.readBy.find((d) => d.user.toString() === userId.toString());
    if (!exists) {
      message.readBy.push({ user: userId, at: now });
    }
    const chat = await Chat.findById(message.chat).select('users');
    const recipients = chat.users.filter(
      (u) => u.toString() !== message.sender.toString()
    );
    let readAll = false;
    if (message.readBy.length >= recipients.length) {
      readAll = true;
      message.status = 'read_all';
    } else if (message.status === 'sent' && message.deliveredTo.length >= recipients.length) {
      message.status = 'delivered_all';
    }
    await message.save();
    await ConversationParticipant.findOneAndUpdate(
      { chat: chat._id, user: userId },
      { lastReadMessage: message._id, lastReadAt: now },
      { upsert: true }
    );
    const io = req.app.get('io');
    io.to(chat._id.toString()).emit('message-read', {
      messageId: message._id,
      readerId: userId,
      at: now,
      readAll,
    });
    io.to(chat._id.toString()).emit('participant-last-read', {
      conversationId: chat._id,
      userId,
      lastReadMessageId: message._id,
      at: now,
    });
    res.json({ messageId: message._id, readBy: message.readBy, readAll });
  } catch (error) {
    console.error('Ack read error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const ackReadUpTo = async (req, res) => {
  try {
    const { id } = req.params; // chatId
    const { messageId } = req.body;
    const userId = req.user._id;
    const now = new Date();
    const messages = await Message.find({
      chat: id,
      _id: { $lte: messageId },
      sender: { $ne: userId },
      'readBy.user': { $ne: userId },
    }).sort({ createdAt: 1 });
    for (const msg of messages) {
      msg.readBy.push({ user: userId, at: now });
      await msg.save();
    }
    await ConversationParticipant.findOneAndUpdate(
      { chat: id, user: userId },
      { lastReadMessage: messageId, lastReadAt: now },
      { upsert: true }
    );
    const io = req.app.get('io');
    io.to(id.toString()).emit('participant-last-read', {
      conversationId: id,
      userId,
      lastReadMessageId: messageId,
      at: now,
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Ack read up to error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getLastRead = async (req, res) => {
  try {
    const { id } = req.params; // chatId
    const participants = await ConversationParticipant.find({ chat: id })
      .select('user lastReadMessage lastReadAt')
      .lean();
    res.json({ participants });
  } catch (error) {
    console.error('Get last read error:', error);
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
    await Reaction.deleteMany({ message: id });

    const chat = await Chat.findById(message.chat);
    let updatedLatestMessage = null;
    if (chat.latestMessage && chat.latestMessage.toString() === id) {
      const latestMessage = await Message.findOne({
        chat: message.chat,
        deletedForEveryone: { $ne: true }
      })
        .sort({ createdAt: -1 })
        .populate('sender', 'name email avatar')
        .populate('readBy.user', 'name email avatar')
        .populate('deliveredTo.user', 'name email avatar');

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
 * @desc    Get a single message by ID
 * @route   GET /api/messages/:id
 * @access  Private
 */
const getMessageById = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await Message.findById(id)
      .populate('sender', 'name email avatar');
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    const chat = await Chat.findById(message.chat);
    if (!chat || !chat.users.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this message' });
    }
    res.json(formatMessage(message));
  } catch (error) {
    console.error('Get message error:', error);
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
  ackDelivery,
  ackRead,
  ackReadUpTo,
  getLastRead,
  deleteMessage,
  getThread,
  searchMessages,
  getMessageById,
  uploadAttachments,
  toggleReaction,
};