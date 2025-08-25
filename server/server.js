const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const chatRoutes = require('./routes/chat.routes');
const messageRoutes = require('./routes/message.routes');

// Import socket service
const socketService = require('./services/socket.service');

// Create Express app
const app = express();

// Middleware
// Configure allowed origins using CLIENT_URL and known dev URLs
const extra = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((s) => s.trim())
  : [];
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  ...(process.env.RAILWAY_STATIC_URL
    ? [`https://${process.env.RAILWAY_STATIC_URL}`]
    : []),
  ...extra,
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
// Increase body size limit so Base64-encoded attachments can be sent
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
}

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'LiveChat API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);

// Serve React app for any other routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build/index.html'));
  });
}

// Create HTTP server
const server = http.createServer(app);

// Create Socket.IO server
const io = socketIo(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Initialize socket service
socketService(io);

// Helper to establish a MongoDB connection. When a connection string isn't
// available or MongoDB is unreachable, fall back to an in-memory instance so
// that development and tests can still run.
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI not defined');
    }
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.log('Starting in-memory MongoDB instance...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('Connected to in-memory MongoDB');
  }
};

// Start server after attempting database connection
const startServer = async () => {
  await connectDB();
  const PORT = process.env.PORT || 8080;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});