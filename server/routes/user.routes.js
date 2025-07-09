const express = require('express');
const router = express.Router();
const { getUsers, getUserById, updateStatus, searchUsers } = require('../controllers/user.controller');
const { protect, admin } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Get all users
router.get('/', getUsers);

// Search users
router.get('/search', searchUsers);

// Update user status
router.put('/status', updateStatus);

// Get user by ID
router.get('/:id', getUserById);

module.exports = router;