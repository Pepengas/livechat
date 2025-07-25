const User = require('../models/user.model');
const Chat = require('../models/chat.model');

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