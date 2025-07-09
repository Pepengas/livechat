const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      required: [true, 'Chat name is required']
    },
    isGroupChat: {
      type: Boolean,
      default: false
    },
    users: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    latestMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    groupAdmin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    avatar: {
      type: String,
      default: function() {
        // Generate a default avatar for group chats
        if (this.isGroupChat) {
          return `https://ui-avatars.com/api/?name=${this.name}&background=random`;
        }
        return null;
      }
    }
  },
  {
    timestamps: true
  }
);

const Chat = mongoose.model('Chat', chatSchema);

module.exports = Chat;