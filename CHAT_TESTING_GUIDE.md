# 💬 Chat Testing Guide - Mentor-Mentee Communication

## ✅ Chat System Status

Your chat system is **FULLY IMPLEMENTED** and should be working! Here's what you have:

### 🔧 Backend Implementation:
- ✅ Socket.io server configured (port 5000)
- ✅ Message model with conversationId system
- ✅ Real-time message sending/receiving
- ✅ Online/offline status tracking
- ✅ Typing indicators
- ✅ Message persistence in MongoDB
- ✅ Chat history API endpoints
- ✅ CORS configured for ports 8080 & 8081

### 🎨 Frontend Implementation:
- ✅ Socket.io client connected
- ✅ useSocket custom hook
- ✅ Chat UI with message display
- ✅ Real-time message updates
- ✅ Typing indicators
- ✅ Online status display
- ✅ Send/receive messages
- ✅ Auto-scroll to latest message

## 🚀 How to Test the Chat

### Step 1: Start Both Servers

**Backend (Terminal 1):**
```powershell
cd mentor-backend
node index.js
```

Expected output:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
📡 API available at http://localhost:5000/api
🔌 WebSocket available at http://localhost:5000
```

**Frontend (Terminal 2):**
```powershell
cd mentor-frontend
npm run dev
```

Expected output:
```
VITE ready in Xms
➜  Local: http://localhost:8081/
```

### Step 2: Open Two Browser Windows

**Window 1 - Student:**
1. Open: http://localhost:8081
2. Login as Student: `deepanshu@example.com`
3. Go to "Find Mentors" page
4. Click on a mentor
5. Click "Message" or "Start Chat"

**Window 2 - Mentor:**
1. Open: http://localhost:8081 (new window/incognito)
2. Login as Mentor: `satyamsinghal124@gmail.com`
3. Navigate to Dashboard
4. Should see chat notifications if student sent messages

### Step 3: Test Chat Features

#### Test 1: Send Message (Student → Mentor)
1. In Student window, type: "Hello, I need help with React"
2. Press Enter or click Send
3. Message should appear immediately
4. Check Mentor window - should receive message in real-time

#### Test 2: Reply (Mentor → Student)
1. In Mentor window, click on the conversation
2. Type: "Sure! I can help you with that."
3. Press Enter
4. Check Student window - should receive instantly

#### Test 3: Typing Indicator
1. In Student window, start typing (don't send)
2. Check Mentor window - should show "Student is typing..."
3. Stop typing - indicator should disappear after 2 seconds

#### Test 4: Online Status
1. Close Student window (logout or close tab)
2. In Mentor window - should show student as offline
3. Reopen Student window and login
4. Should show as online again

#### Test 5: Message History
1. Send several messages back and forth
2. Refresh both windows
3. All messages should load from database
4. Message order should be preserved

## 🔍 Troubleshooting

### Issue 1: "Socket not connected"

**Check:**
1. Backend terminal shows: `🔌 User connected: [socket-id]`
2. Browser console (F12) shows: `✅ Socket connected: [socket-id]`

**Fix:**
```javascript
// In browser console, check:
console.log(localStorage.getItem('authUser'));
// Should have user data with email
```

### Issue 2: Messages not sending

**Check Backend Terminal:**
```
👤 User user@email.com joined
💬 Message sent from: sender@email.com
```

**Check Browser Console (F12):**
```javascript
// Should see:
✅ Socket connected: abc123
```

**Fix:**
- Ensure user is logged in
- Check if socket is connected
- Verify backend is running on port 5000

### Issue 3: Messages sending but not receiving

**Possible causes:**
1. Receiver not connected to socket
2. Email mismatch (sender/receiver)
3. Socket room not joined

**Fix:**
```javascript
// Check socket connection in both windows:
// Browser Console (F12) in both windows:
window.socket = socket; // Add this in useSocket hook for debugging
```

### Issue 4: "CORS error"

**Check:**
- Backend index.js has port 8081 in CORS ✅ (Just fixed!)
- Both Socket.io and Express CORS updated

**Restart backend after CORS fix:**
```powershell
cd mentor-backend
node index.js
```

### Issue 5: Old messages not loading

**Check Database:**
```javascript
// In MongoDB
use mentorconnect;
db.messages.find().pretty();
```

**Check API:**
```
http://localhost:5000/api/chat/conversation/student@email.com/mentor@email.com
```

## 🎯 Chat Flow Diagram

```
Student Browser                Backend Server              Mentor Browser
     |                              |                            |
     |-- 1. Connect Socket -------->|<----- 1. Connect Socket ---|
     |<--- 2. Socket ID ------------|-------- 2. Socket ID ----->|
     |                              |                            |
     |-- 3. Join (email) ---------->|                            |
     |                              |--- Store user online --->  |
     |                              |                            |
     |-- 4. Send Message ---------->|                            |
     |                              |--- Save to DB             |
     |                              |--- Send to receiver ----->|
     |                              |                            |
     |<--- 5. Message Sent ---------|                            |
     |                              |                       Display ✅
     |                              |                            |
     |                              |<--- 6. Reply --------------|
     |<--- 7. Receive Message ------|                            |
Display ✅                          |                            |
```

## 📊 Database Structure

### Messages Collection
```javascript
{
  _id: ObjectId,
  conversationId: "email1_email2", // Sorted alphabetically
  sender: "student@email.com",
  receiver: "mentor@email.com",
  content: "Hello, I need help",
  timestamp: ISODate("2025-11-13T..."),
  read: false,
  type: "text",
  createdAt: ISODate,
  updatedAt: ISODate
}
```

## 🧪 Test Commands

### Check Socket Connection (Browser Console):
```javascript
// Open F12 Developer Tools → Console
localStorage.getItem('authUser');
// Should return user data with email
```

### Test Socket Manually:
```javascript
// In browser console after page loads
socket.emit('send-message', {
  sender: 'your@email.com',
  receiver: 'other@email.com',
  content: 'Test message',
  type: 'text'
});
```

### Check Backend Logs:
```
🔌 User connected: abc123
👤 User student@email.com joined
💬 Message from student@email.com to mentor@email.com
```

## 📱 Chat UI Features

### Available in Chat Page:
- ✅ Message input field
- ✅ Send button
- ✅ Message history scrolling
- ✅ Timestamps on messages
- ✅ Sender/receiver distinction (left/right alignment)
- ✅ Online/offline status indicator
- ✅ Typing indicator
- ✅ Mentor profile card
- ✅ Auto-scroll to bottom

### Keyboard Shortcuts:
- **Enter**: Send message
- **Shift + Enter**: New line (if implemented)

## 🔐 Security Notes

### Current Implementation:
- ✅ Socket.io with CORS protection
- ✅ Message persistence in database
- ✅ User authentication via localStorage
- ⚠️ No message encryption (plaintext)
- ⚠️ No rate limiting on messages

### Production Recommendations:
- Add end-to-end encryption
- Implement rate limiting
- Add message moderation
- Add file attachment support
- Add read receipts
- Add message editing/deletion
- Add emoji support
- Add voice/video call integration

## ✨ Quick Test Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 8081
- [ ] Student logged in (Window 1)
- [ ] Mentor logged in (Window 2)
- [ ] Socket connected (check console in both)
- [ ] Student sends message
- [ ] Mentor receives message
- [ ] Mentor replies
- [ ] Student receives reply
- [ ] Typing indicator works
- [ ] Messages persist after refresh
- [ ] Online status updates

## 🎉 Success Criteria

Chat is working when:
1. ✅ Both users can connect to socket
2. ✅ Messages send in real-time
3. ✅ Messages appear in both windows instantly
4. ✅ Messages persist after page refresh
5. ✅ Online/offline status updates
6. ✅ Typing indicators appear
7. ✅ No console errors in either window
8. ✅ Backend logs show connections

## 🆘 Still Not Working?

### Restart Everything:
```powershell
# Kill all node processes
taskkill /F /IM node.exe

# Start backend
cd mentor-backend
node index.js

# Start frontend (new terminal)
cd mentor-frontend
npm run dev
```

### Check MongoDB:
```powershell
# Verify MongoDB is running
mongosh
use mentorconnect
show collections
db.messages.countDocuments()
```

### Clear Cache:
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

### Verify Ports:
```powershell
# Check if port 5000 is in use
netstat -ano | findstr :5000

# Check if port 8081 is in use
netstat -ano | findstr :8081
```

---

## 📞 Need More Help?

If chat still doesn't work after following this guide:

1. Check browser console (F12) for errors
2. Check backend terminal for errors
3. Verify user emails are correct
4. Ensure MongoDB is running
5. Confirm CORS is configured correctly (✅ just fixed!)
6. Test socket connection with manual emit (see test commands above)

Your chat system has all the necessary components and should work perfectly! 🚀
