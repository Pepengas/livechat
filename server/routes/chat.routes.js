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
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Access or create one-to-one chat
router.post('/', accessChat);

// Get all chats for a user
router.get('/', getChats);

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