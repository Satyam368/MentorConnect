# Live Chat Feature - Implementation Guide

## ✅ Features Implemented

### Real-Time Communication
- **WebSocket Integration**: Using Socket.io for bi-directional communication
- **Instant Messaging**: Messages appear in real-time without page refresh
- **Online Status**: See when mentors/students are online (green dot)
- **Typing Indicators**: Shows when the other person is typing
- **Message Persistence**: All messages saved to MongoDB
- **Connection Status**: Visual feedback when connecting/disconnected

### Backend Implementation

#### Files Created:
1. **`models/Message.js`** - MongoDB schema for storing messages
   - Conversation ID (sorted user IDs)
   - Sender/Receiver emails
   - Message content, timestamp, read status
   - Message type (text/file/image)

2. **`controllers/chatController.js`** - Chat API endpoints
   - `getConversation` - Get chat history between two users
   - `getUserConversations` - Get all conversations for a user
   - `markAsRead` - Mark messages as read
   - `saveMessage` - Backup for saving messages

3. **`routes/chat.js`** - REST API routes
   - `GET /api/chat/conversation/:userId/:otherUserId`
   - `GET /api/chat/conversations/:userId`
   - `POST /api/chat/mark-read`
   - `POST /api/chat/message`

4. **Updated `index.js`** - Socket.io server integration
   - WebSocket server on same port as Express
   - Real-time event handlers:
     - `join` - User joins with their ID
     - `send-message` - Send message to another user
     - `typing` - Typing indicator
     - `stop-typing` - Stop typing indicator
     - `disconnect` - User goes offline

### Frontend Implementation

#### Files Created/Updated:
1. **`hooks/useSocket.ts`** - React hook for Socket.io connection
   - Manages socket connection lifecycle
   - Tracks online users
   - Connection status monitoring
   - Auto-reconnection on disconnect

2. **Updated `lib/api.ts`** - Added chat API endpoints
   - `CHAT_CONVERSATION` - Fetch conversation history
   - `CHAT_CONVERSATIONS` - Get all user conversations
   - `CHAT_MARK_READ` - Mark messages as read
   - `CHAT_SEND_MESSAGE` - Send message (REST backup)

3. **Updated `pages/Chat.tsx`** - Complete live chat UI
   - Real-time message sending/receiving
   - Typing indicators with animation
   - Online/offline status display
   - Auto-scroll to latest message
   - Optimistic UI updates
   - Message history fetching

## 🚀 How to Use

### Start Backend:
```bash
cd mentor-backend
npm install socket.io  # Already done
node index.js
```

### Start Frontend:
```bash
cd mentor-frontend
npm install socket.io-client  # Already done
npm run dev
```

### Access Chat:
1. Login as a student
2. Navigate to a mentor's profile
3. Click "Message" or visit `/chat/:mentorEmail`
4. Start chatting in real-time!

## 💡 How It Works

### Message Flow:
1. **User Types** → Typing indicator sent via socket
2. **User Sends** → Message saved to DB & sent via socket
3. **Receiver Online** → Message delivered instantly
4. **Receiver Offline** → Message stored, delivered when they connect
5. **Both See Updates** → Real-time synchronization

### Connection Flow:
```
Frontend                Backend               Database
   |                       |                      |
   |--[Connect Socket]---->|                      |
   |<--[Connected]---------|                      |
   |--[Join(userId)]------>|                      |
   |                       |--[Mark Online]------>|
   |                       |                      |
   |--[Send Message]------>|                      |
   |                       |--[Save]------------->|
   |                       |--[Emit to receiver]->|
   |<--[Confirmation]------|                      |
```

## 🎯 Key Features

### Online Status
- **Green Dot**: User is online and connected
- **Gray Dot**: User is offline
- Real-time status updates when users connect/disconnect

### Typing Indicator
- Animated dots appear when other person is typing
- Automatically stops after 2 seconds of inactivity
- Only visible to the receiver

### Message Persistence
- All messages saved to MongoDB
- Conversation history loaded on chat open
- Messages available even after disconnect

### Error Handling
- Connection errors shown with alerts
- Failed message attempts with toast notifications
- Auto-reconnection on network issues

## 📝 Database Schema

### Message Collection:
```javascript
{
  conversationId: "email1_email2",  // Sorted alphabetically
  sender: "user1@example.com",
  receiver: "user2@example.com",
  content: "Hello!",
  timestamp: Date,
  read: Boolean,
  type: "text" | "file" | "image"
}
```

## 🔧 Configuration

### Backend Port: `5000`
- REST API: `http://localhost:5000/api`
- WebSocket: `http://localhost:5000`

### Frontend: `http://localhost:5173`

### CORS Origins:
- localhost:3000
- localhost:5173
- localhost:5174
- localhost:8080

## 🎨 UI Features

- ✅ Real-time messages with user avatars
- ✅ Message timestamps (HH:MM format)
- ✅ Different colors for sent/received messages
- ✅ Auto-scroll to newest message
- ✅ Empty state when no messages
- ✅ Connection status indicator
- ✅ Typing animation (bouncing dots)
- ✅ Disabled state when disconnected
- ✅ Mentor info sidebar with quick actions

## 🚧 Future Enhancements

### Potential Features:
- [ ] File/Image sharing
- [ ] Voice/Video calls
- [ ] Message reactions (like, love, etc.)
- [ ] Message editing/deletion
- [ ] Read receipts (double checkmarks)
- [ ] Group chats
- [ ] Message search
- [ ] Notifications for new messages
- [ ] Emoji picker
- [ ] Link previews

## 🐛 Troubleshooting

### "Not Connected" Message:
- Ensure backend server is running
- Check console for connection errors
- Verify MongoDB is connected
- Check CORS settings

### Messages Not Sending:
- Check WebSocket connection status
- Verify user is logged in
- Check browser console for errors
- Ensure mentorId parameter is correct

### No Chat History:
- Verify MongoDB connection
- Check if conversation exists in database
- Ensure API endpoints return 200 status

## 📊 Performance

- **Socket.io** provides efficient bi-directional communication
- **Optimistic UI updates** for instant feedback
- **Message batching** for efficient database writes
- **Connection pooling** for scalable WebSocket connections
- **Indexed queries** for fast message retrieval

---

**Status**: ✅ Fully Functional Live Chat System

**Technologies**: 
- Socket.io (WebSocket)
- Express.js (REST API)
- MongoDB (Message Storage)
- React + TypeScript (Frontend)
- Custom React Hooks (Connection Management)
