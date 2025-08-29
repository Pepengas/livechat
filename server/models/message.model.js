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
      default: ''
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true
    },
    parentMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    replyToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },
    replyToSnapshot: {
      senderName: { type: String },
      text: { type: String }
    },
    threadCount: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['sent', 'delivered_all', 'read_all'],
      default: 'sent'
    },
    deliveredTo: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now }
      }
    ],
    readBy: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        at: { type: Date, default: Date.now }
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

messageSchema.index({ chat: 1, createdAt: 1 });
messageSchema.index({ chat: 1, createdAt: -1, _id: -1 });
messageSchema.index({ 'deliveredTo.user': 1 });
messageSchema.index({ 'readBy.user': 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;