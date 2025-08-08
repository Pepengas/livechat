const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, logout, uploadAvatar, forgotPassword, resetPassword } = require('../controllers/auth.controller');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { protect } = require('../middleware/auth.middleware');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/avatar', protect, upload.single('avatar'), uploadAvatar);
router.post('/logout', protect, logout);

module.exports = router;