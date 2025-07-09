const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define User Schema
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['online', 'offline'],
      default: 'offline',
    },
    lastActive: {
      type: Date,
      default: Date.now,
    },
    socketId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

async function createTestAccounts() {
  try {
    // Check if test users already exist
    const existingUser1 = await User.findOne({ email: 'test1@example.com' });
    const existingUser2 = await User.findOne({ email: 'test2@example.com' });

    // Create first test account if it doesn't exist
    if (!existingUser1) {
      const user1 = await User.create({
        name: 'Test User 1',
        email: 'test1@example.com',
        password: 'password123',
        status: 'offline'
      });
      console.log('Test User 1 created:', user1);
    } else {
      console.log('Test User 1 already exists');
    }

    // Create second test account if it doesn't exist
    if (!existingUser2) {
      const user2 = await User.create({
        name: 'Test User 2',
        email: 'test2@example.com',
        password: 'password123',
        status: 'offline'
      });
      console.log('Test User 2 created:', user2);
    } else {
      console.log('Test User 2 already exists');
    }

    console.log('\nTest Account Credentials:\n');
    console.log('Account 1:');
    console.log('Email: test1@example.com');
    console.log('Password: password123');
    console.log('\nAccount 2:');
    console.log('Email: test2@example.com');
    console.log('Password: password123');

    // Close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');

  } catch (error) {
    console.error('Error creating test accounts:', error);
    await mongoose.connection.close();
  }
}

createTestAccounts();