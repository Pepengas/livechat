const mongoose = require('mongoose');

const conversationParticipantSchema = new mongoose.Schema(
  {
    chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    lastReadMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', default: null },
    lastReadAt: { type: Date, default: null }
  },
  { timestamps: true }
);

conversationParticipantSchema.index({ chat: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('ConversationParticipant', conversationParticipantSchema);
