# LiveChat - Real-time Office Communication App

A real-time live chat web application for internal office communication between coworkers.

## Features

### Core Features
- User Authentication (email & password, with registration & login)
- Private Messages (1:1 chat between coworkers)
- Group Chats (create, join, and leave group chats)
- Real-time Messaging (using Socket.IO)
- Online Status indicator (show who's online/offline)
- Message Timestamps
- Responsive Design (usable on desktop and mobile)

### Optional Features
- Typing indicators ("X is typing...")
- Emoji support
- File/image attachment support (PDF, images)
- Message search in conversation
- Admin dashboard to manage users and rooms

## Tech Stack
- **Frontend:** React.js with TailwindCSS
- **Backend:** Node.js with Express
- **Real-Time Engine:** Socket.IO
- **Database:** MongoDB
- **Authentication:** JWT-based authentication

## Project Structure
```
livehcat/
├── client/                 # Frontend React application
│   ├── public/
│   └── src/
│       ├── components/     # Reusable UI components
│       ├── contexts/       # React contexts for state management
│       ├── hooks/          # Custom React hooks
│       ├── pages/          # Page components
│       ├── services/       # API services
│       └── utils/          # Utility functions
└── server/                 # Backend Node.js application
    ├── config/             # Configuration files
    ├── controllers/        # Route controllers
    ├── middleware/         # Express middleware
    ├── models/             # MongoDB models
    ├── routes/             # API routes
    ├── services/           # Business logic
    └── utils/              # Utility functions
```

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB

### Installation

1. Clone the repository
2. Install dependencies for both client and server
   ```
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```
3. Create a `.env` file in the server directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/livechat
   JWT_SECRET=your_jwt_secret
   ```
4. Start the development servers
   ```
   # Start server
   cd server
   npm run dev

   # Start client
   cd ../client
   npm start
   ```

### Test Accounts

The application comes with two test accounts:

- Email: test1@example.com, Password: password123
- Email: test2@example.com, Password: password123

## License
MIT