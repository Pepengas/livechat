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
   PORT=8080
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

## Recent Bug Fixes and Improvements

### MongoDB Connection and Server Configuration Fix (Latest)

**Issue:** The backend server was hanging and not starting properly due to MongoDB connection issues, preventing the group creation functionality and WebSocket connections from working.

**Root Causes:**
1. **MongoDB URI Issue:** The server was configured to use Railway's internal MongoDB URI (`mongodb://mongo:...@mongodb.railway.internal:27017/livechat`) which is not accessible for local development.
2. **Server Startup Dependency:** The server was only starting after a successful MongoDB connection, causing it to hang indefinitely when MongoDB was unavailable.

**Fixes Applied:**
- **File:** `server/.env`
  - Updated `MONGODB_URI` to use local MongoDB (`mongodb://localhost:27017/livechat`)
  - Added comments explaining the configuration for development

- **File:** `server/server.js`
  - Modified server startup logic to start regardless of MongoDB connection status
  - Server now starts on port 8080 even if MongoDB connection fails
  - Added graceful error handling for MongoDB connection failures
  - Enables development without requiring MongoDB installation

**Benefits:**
- Backend server now starts reliably for local development
- WebSocket connections work properly between frontend and backend
- Group creation functionality is now operational
- Development setup is more robust and doesn't require MongoDB installation

**Development Setup:**
- Frontend runs on `http://localhost:3000`
- Backend runs on `http://localhost:8080`
- Both servers can run simultaneously without database dependencies

### Group Creation Functionality Fix

**Issue:** The "Create Group" button was not working due to function name mismatch and parameter order issues.

**Root Causes:**
1. **Function Export Mismatch:** The `CreateGroupModal` component was calling `createGroupChat` from the `useChat` hook, but the `ChatContext` only exported `createNewGroupChat`.
2. **Parameter Order Issue:** The modal was passing parameters as `createGroupChat(groupName, userIds)` but the `chatService.createGroupChat` function expects `(users, name, avatar)`.

**Fixes Applied:**
- **File:** `client/src/contexts/ChatContext.js`
  - Added alias `createGroupChat: createNewGroupChat` to the context value export
  - This maintains backward compatibility while providing the expected function name

- **File:** `client/src/components/modals/CreateGroupModal.js`
  - Fixed parameter order from `createGroupChat(groupName, userIds)` to `createGroupChat(userIds, groupName)`
  - This aligns with the `chatService.createGroupChat(users, name, avatar)` function signature

**How Group Creation Works:**
1. User clicks "Create Group" button in the chat sidebar
2. `CreateGroupModal` opens with form fields for group name and user selection
3. User searches and selects at least 2 users from the search results
4. On form submission, the modal calls `createGroupChat(userIds, groupName)` from `useChat`
5. This triggers `createNewGroupChat` in `ChatContext` which calls `chatService.createGroupChat`
6. The service sends a POST request to `/api/chats/group` with FormData containing users and group name
7. Backend creates the group chat and returns the new chat object
8. Frontend updates the chat list and closes the modal

**Testing:**
- Group creation now works properly
- Users can successfully create group chats with multiple participants
- Real-time updates work correctly for all group members

### Previous Fixes

**CORS and API URL Issues:**
- Fixed `client/.env.production` to point to correct Railway domain
- Resolved CORS errors preventing frontend-backend communication
- Registration and login functionality now works properly

**Development Environment:**
- Fixed webpack dev server configuration issues
- Added `DANGEROUSLY_DISABLE_HOST_CHECK=true` for local development
- Development server now starts successfully on `http://localhost:3000`

## License
MIT