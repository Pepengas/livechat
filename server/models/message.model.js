const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      trim: true,
      default: ''
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    attachments: [
      {
        type: {
          type: String,
          required: true
        },
        url: {
          type: String,
          required: true
        },
        name: {
          type: String,
          required: true
        },
        size: {
          type: Number
        }
      }
    ],
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    deletedForEveryone: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;