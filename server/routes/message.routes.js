const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
  searchMessages,
  uploadAttachments,
} = require('../controllers/message.controller');
const multer = require('multer');
const path = require('path');
const {
  generateUniqueFilename,
  isValidFileType,
} = require('../utils/fileUpload');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    cb(null, generateUniqueFilename(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (isValidFileType(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});
const { protect } = require('../middleware/auth.middleware');

// All routes are protected
router.use(protect);

// Upload message attachments
router.post('/upload', upload.array('files'), uploadAttachments);

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