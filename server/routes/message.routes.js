const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  searchMessages,
} = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Send a new message
router.post('/', sendMessage);

// Get all messages for a chat
router.get('/:chatId', getMessages);

// Mark messages as read
router.put('/read/:chatId', markAsRead);

// Delete a message
router.delete('/:id', deleteMessage);

// Search messages in a chat
router.get('/search/:chatId', searchMessages);

module.exports = router;