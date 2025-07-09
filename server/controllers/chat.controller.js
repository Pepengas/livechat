const Chat = require('../models/chat.model');
const User = require('../models/user.model');
const Message = require('../models/message.model');

/**
 * @desc    Create or access a one-to-one chat
 * @route   POST /api/chats
 * @access  Private
 */
const accessChat = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'UserId param not sent with request' });
    }

    // Check if chat exists between current user and the specified user
    let chat = await Chat.find({
      isGroupChat: false,
      $and: [
        { users: { $elemMatch: { $eq: req.user._id } } },
        { users: { $elemMatch: { $eq: userId } } },
      ],
    })
      .populate('users', '-password')
      .populate('latestMessage');

    chat = await User.populate(chat, {
      path: 'latestMessage.sender',
      select: 'name email avatar',
    });

    if (chat.length > 0) {
      res.json(chat[0]);
    } else {
      // Create a new chat
      const targetUser = await User.findById(userId);
      
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      const chatName = `${req.user.name}, ${targetUser.name}`;
      
      const newChat = await Chat.create({
        name: chatName,
        isGroupChat: false,
        users: [req.user._id, userId],
      });

      const fullChat = await Chat.findById(newChat._id).populate(
        'users',
        '-password'
      );

      res.status(201).json(fullChat);
    }
  } catch (error) {
    console.error('Access chat error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Get all chats for a user
 * @route   GET /api/chats
 * @access  Private
 */
const getChats = async (req, res) => {
  try {
    // Find all chats that the user is part of
    let chats = await Chat.find({
      users: { $elemMatch: { $eq: req.user._id } },
    })
      .populate('users', '-password')
      .populate('groupAdmin', '-password')
      .populate('latestMessage')
      .sort({ updatedAt: -1 });

    chats = await User.populate(chats, {
      path: 'latestMessage.sender',
      select: 'name email avatar',
    });

    res.json(chats);
  } catch (error) {
    console.error('Get chats error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Create a group chat
 * @route   POST /api/chats/group
 * @access  Private
 */
const createGroupChat = async (req, res) => {
  try {
    const { name, users } = req.body;

    if (!name || !users) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Parse users if it's a string
    let usersList = users;
    if (typeof users === 'string') {
      usersList = JSON.parse(users);
    }

    // Check if there are at least 2 users
    if (usersList.length < 2) {
      return res.status(400).json({ message: 'A group chat requires at least 3 users (including yourself)' });
    }

    // Add current user to the group
    usersList.push(req.user._id);

    // Create the group chat
    const groupChat = await Chat.create({
      name,
      isGroupChat: true,
      users: usersList,
      groupAdmin: req.user._id,
    });

    // Fetch the complete group chat with populated user details
    const fullGroupChat = await Chat.findById(groupChat._id)
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.status(201).json(fullGroupChat);
  } catch (error) {
    console.error('Create group chat error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Rename a group chat
 * @route   PUT /api/chats/group/:id
 * @access  Private
 */
const renameGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;

    if (!name) {
      return res.status(400).json({ message: 'Please provide a name' });
    }

    // Update the chat name
    const updatedChat = await Chat.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    if (!updatedChat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is admin or part of the group
    if (
      !updatedChat.users.some(user => user._id.toString() === req.user._id.toString()) &&
      updatedChat.groupAdmin._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized to update this group' });
    }

    res.json(updatedChat);
  } catch (error) {
    console.error('Rename group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Add user to a group
 * @route   PUT /api/chats/group/:id/add
 * @access  Private
 */
const addToGroup = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'Please provide a user ID' });
    }

    // Find the chat
    const chat = await Chat.findById(id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if the requester is the admin
    if (chat.groupAdmin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admins can add users to the group' });
    }

    // Check if user is already in the group
    if (chat.users.includes(userId)) {
      return res.status(400).json({ message: 'User already in the group' });
    }

    // Add user to the group
    const updatedChat = await Chat.findByIdAndUpdate(
      id,
      { $push: { users: userId } },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.json(updatedChat);
  } catch (error) {
    console.error('Add to group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Remove user from a group
 * @route   PUT /api/chats/group/:id/remove
 * @access  Private
 */
const removeFromGroup = async (req, res) => {
  try {
    const { userId } = req.body;
    const { id } = req.params;

    if (!userId) {
      return res.status(400).json({ message: 'Please provide a user ID' });
    }

    // Find the chat
    const chat = await Chat.findById(id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if the requester is the admin or the user is removing themselves
    if (
      chat.groupAdmin.toString() !== req.user._id.toString() &&
      userId !== req.user._id.toString()
    ) {
      return res.status(403).json({
        message: 'Only admins can remove users or users can remove themselves',
      });
    }

    // Remove user from the group
    const updatedChat = await Chat.findByIdAndUpdate(
      id,
      { $pull: { users: userId } },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    res.json(updatedChat);
  } catch (error) {
    console.error('Remove from group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc    Leave a group chat
 * @route   PUT /api/chats/group/:id/leave
 * @access  Private
 */
const leaveGroup = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the chat
    const chat = await Chat.findById(id);

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Check if user is in the group
    if (!chat.users.includes(req.user._id)) {
      return res.status(400).json({ message: 'You are not in this group' });
    }

    // If user is the admin and there are other users, transfer admin role
    if (
      chat.groupAdmin.toString() === req.user._id.toString() &&
      chat.users.length > 1
    ) {
      // Find another user to make admin
      const newAdminId = chat.users.find(
        userId => userId.toString() !== req.user._id.toString()
      );

      // Update admin and remove user
      const updatedChat = await Chat.findByIdAndUpdate(
        id,
        {
          groupAdmin: newAdminId,
          $pull: { users: req.user._id },
        },
        { new: true }
      )
        .populate('users', '-password')
        .populate('groupAdmin', '-password');

      return res.json(updatedChat);
    }

    // If user is not admin or is the only user left, just remove them
    const updatedChat = await Chat.findByIdAndUpdate(
      id,
      { $pull: { users: req.user._id } },
      { new: true }
    )
      .populate('users', '-password')
      .populate('groupAdmin', '-password');

    // If no users left, delete the chat
    if (updatedChat.users.length === 0) {
      await Chat.findByIdAndDelete(id);
      await Message.deleteMany({ chat: id });
      return res.json({ message: 'Group deleted as no users remain' });
    }

    res.json(updatedChat);
  } catch (error) {
    console.error('Leave group error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  accessChat,
  getChats,
  createGroupChat,
  renameGroup,
  addToGroup,
  removeFromGroup,
  leaveGroup,
};