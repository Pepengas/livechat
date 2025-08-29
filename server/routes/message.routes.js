const express = require('express');
const router = express.Router();
const {
  sendMessage,
  getMessages,
  markAsRead,
  ackDelivery,
  ackRead,
  deleteMessage,
  searchMessages,
  uploadAttachments,
  getThread,
  toggleReaction,
} = require('../controllers/message.controller');
const multer = require('multer');
const { isValidFileType } = require('../utils/fileUpload');

// Store files in memory so we can convert them to Base64 before saving
const storage = multer.memoryStorage();

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

// Acknowledge delivery
router.post('/:id/ack-delivery', ackDelivery);

// Acknowledge read for a single message
router.post('/:id/ack-read', ackRead);

// Get a message thread
router.get('/:id/thread', getThread);

// Toggle reaction
router.post('/:id/reactions', toggleReaction);

// Get all messages for a chat
router.get('/:chatId', getMessages);

// Mark messages as read
router.put('/read/:chatId', markAsRead);

// Delete a message
router.delete('/:id', deleteMessage);

// Search messages in a chat
router.get('/search/:chatId', searchMessages);

module.exports = router;