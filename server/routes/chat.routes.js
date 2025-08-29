const express = require('express');
const router = express.Router();
const {
  accessChat,
  getChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  leaveGroup,
} = require('../controllers/chat.controller');
const { ackReadUpTo, getLastRead } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Access or create one-to-one chat
router.post('/', accessChat);

// Get all chats for a user
router.get('/', getChats);

// Bulk read up to
router.post('/:id/ack-read-up-to', ackReadUpTo);

// Get last read positions
router.get('/:id/last-read', getLastRead);

// Create a group chat
router.post('/group', createGroupChat);

// Rename a group chat
router.put('/group/:id', renameGroup);

// Add user to a group
router.put('/group/:id/add', addToGroup);

// Remove user from a group
router.put('/group/:id/remove', removeFromGroup);

// Leave a group chat
router.put('/group/:id/leave', leaveGroup);

module.exports = router;