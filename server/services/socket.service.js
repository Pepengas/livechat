const User = require('../models/user.model');
const Chat = require('../models/chat.model');
const Message = require('../models/message.model');
const ConversationParticipant = require('../models/conversationParticipant.model');

/**
 * Socket.IO service for real-time communication
 * @param {Object} io - Socket.IO server instance
 */
const socketService = (io) => {
  // Store connected users
  const connectedUsers = new Map();

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Setup user connection
    socket.on('setup', async (userData) => {
      try {
        // Add user to connected users map
        connectedUsers.set(userData._id, socket.id);
        socket.userId = userData._id;
        
        // Update user status in database
        await User.findByIdAndUpdate(userData._id, {
          status: 'online',
          socketId: socket.id,
          lastActive: Date.now(),
        });

        // Emit online status to all users
        socket.broadcast.emit('user-online', { userId: userData._id });

        // Join a room with the user's ID
        socket.join(userData._id);

        // Send list of currently online users to the connected client
        const onlineUsers = Array.from(connectedUsers.keys()).map((id) => ({
          userId: id,
          status: 'online',
        }));
        socket.emit('online-users', onlineUsers);
        socket.emit('connected');
      } catch (error) {
        console.error('Socket setup error:', error);
      }
    });

    // Join a chat room
    socket.on('join-chat', (chatId) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
    });

    // Leave a chat room
    socket.on('leave-chat', (chatId) => {
      socket.leave(chatId);
      console.log(`User left chat: ${chatId}`);
    });

    // Handle new message
    socket.on('new-message', (messageData) => {
      const chat = messageData.chat;

      if (!chat.users) return console.log('Chat users not defined');

      // Send message to all users in the chat except the sender
      // Emit only to each user's personal room to avoid duplicate events
      chat.users.forEach((user) => {
        if (user._id !== messageData.sender._id) {
          socket.to(user._id).emit('message-received', messageData);
        }
      });
    });

    // Handle new thread message
    socket.on('new-thread-message', (messageData) => {
      const chat = messageData.chat;

      if (!chat.users) return console.log('Chat users not defined');

      chat.users.forEach((user) => {
        if (user._id !== messageData.sender._id) {
          socket.to(user._id).emit('thread:messageCreated', messageData);
        }
      });
    });

    // Handle typing status
    socket.on('typing', (chatId) => {
      socket.to(chatId).emit('typing', { chatId, userId: socket.userId });
    });

    // Handle stop typing status
    socket.on('stop-typing', (chatId) => {
      socket.to(chatId).emit('stop-typing', { chatId, userId: socket.userId });
    });

    // Handle read messages
    socket.on('mark-read', ({ chatId, userId }) => {
      socket.to(chatId).emit('messages-read', { chatId, userId });
    });

    socket.on('ack-delivery', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId).populate('chat');
        if (!message) return;
        if (message.sender.toString() === socket.userId.toString()) return;
        if (!message.deliveredTo.find((d) => d.user.toString() === socket.userId.toString())) {
          message.deliveredTo.push({ user: socket.userId, at: new Date() });
        }
        const chat = await Chat.findById(message.chat).select('users');
        const recipients = chat.users.filter(
          (u) => u.toString() !== message.sender.toString()
        );
        let deliveredAll = false;
        if (message.deliveredTo.length >= recipients.length) {
          deliveredAll = true;
          if (message.status === 'sent') message.status = 'delivered_all';
        }
        await message.save();
        io.to(chat._id.toString()).emit('message-delivered', {
          messageId: message._id,
          deliveredTo: message.deliveredTo,
          deliveredAll,
        });
      } catch (err) {
        console.error('ack-delivery error', err);
      }
    });

    socket.on('ack-read', async ({ messageId }) => {
      try {
        const message = await Message.findById(messageId).populate('chat');
        if (!message) return;
        if (message.sender.toString() === socket.userId.toString()) return;
        const now = new Date();
        if (!message.readBy.find((d) => d.user.toString() === socket.userId.toString())) {
          message.readBy.push({ user: socket.userId, at: now });
        }
        const chat = await Chat.findById(message.chat).select('users');
        const recipients = chat.users.filter(
          (u) => u.toString() !== message.sender.toString()
        );
        let readAll = false;
        if (message.readBy.length >= recipients.length) {
          readAll = true;
          message.status = 'read_all';
        } else if (
          message.status === 'sent' &&
          message.deliveredTo.length >= recipients.length
        ) {
          message.status = 'delivered_all';
        }
        await message.save();
        await ConversationParticipant.findOneAndUpdate(
          { chat: chat._id, user: socket.userId },
          { lastReadMessage: message._id, lastReadAt: now },
          { upsert: true }
        );
        io.to(chat._id.toString()).emit('message-read', {
          messageId: message._id,
          readerId: socket.userId,
          at: now,
          readAll,
        });
        io.to(chat._id.toString()).emit('participant-last-read', {
          conversationId: chat._id,
          userId: socket.userId,
          lastReadMessageId: message._id,
          at: now,
        });
      } catch (err) {
        console.error('ack-read error', err);
      }
    });

    socket.on('ack-read-up-to', async ({ conversationId, messageId }) => {
      try {
        const now = new Date();
        const messages = await Message.find({
          chat: conversationId,
          _id: { $lte: messageId },
          sender: { $ne: socket.userId },
          'readBy.user': { $ne: socket.userId },
        }).sort({ createdAt: 1 });
        for (const msg of messages) {
          msg.readBy.push({ user: socket.userId, at: now });
          await msg.save();
        }
        await ConversationParticipant.findOneAndUpdate(
          { chat: conversationId, user: socket.userId },
          { lastReadMessage: messageId, lastReadAt: now },
          { upsert: true }
        );
        io.to(conversationId.toString()).emit('participant-last-read', {
          conversationId,
          userId: socket.userId,
          lastReadMessageId: messageId,
          at: now,
        });
      } catch (err) {
        console.error('ack-read-up-to error', err);
      }
    });

    // Handle user status change
    socket.on('status-change', async ({ status, userId }) => {
      try {
        await User.findByIdAndUpdate(userId, {
          status,
          lastActive: Date.now(),
        });

        // Broadcast status change to all users
        socket.broadcast.emit('user-status-change', { userId, status });
      } catch (error) {
        console.error('Status change error:', error);
      }
    });

    // Handle avatar update
    socket.on('avatar-updated', ({ userId, avatar }) => {
      io.emit('user-avatar-updated', { userId, avatar });
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.id}`);

      // Find user by socket ID
      try {
        const user = await User.findOne({ socketId: socket.id });

        if (user) {
          // Update user status
          user.status = 'offline';
          user.lastActive = Date.now();
          user.socketId = null;
          await user.save();

          // Remove from connected users map
          connectedUsers.delete(user._id.toString());

          // Broadcast offline status
          socket.broadcast.emit('user-offline', { userId: user._id });
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });
};

module.exports = socketService;