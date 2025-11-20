const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

// Import routes
const authRoutes = require("./routes/auth");
const bookingRoutes = require("./routes/booking");
const chatRoutes = require("./routes/chat");
const chatRequestRoutes = require("./routes/chatRequest");
const resourceRoutes = require("./routes/resource");

// Import models
const Message = require("./models/Message");

// Import global exception handlers
const { notFoundHandler, errorHandler, registerGlobalHandlers } = require("./globalhandle/globalexception");

// Optional dependencies
let nodemailer;
let twilio;
try {
  nodemailer = require("nodemailer");
} catch (_) {
  nodemailer = null;
}
try {
  twilio = require("twilio");
} catch (_) {
  twilio = null;
}

const app = express();
const server = http.createServer(app);

// Socket.io Configuration
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5000", 
      "http://localhost:5173", 
      "http://localhost:5174", 
      "http://localhost:8080",
      "http://localhost:8081"
    ],
    credentials: true
  }
});

// Store online users
const onlineUsers = new Map();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('🔌 User connected:', socket.id);

  // User joins with their email/ID
  socket.on('join', (userId) => {
    onlineUsers.set(userId, socket.id);
    socket.userId = userId;
    console.log(`👤 User ${userId} joined`);
    console.log('📊 Current online users:', Array.from(onlineUsers.keys()));
    
    // Send current online users list to the newly joined user
    socket.emit('online-users-list', Array.from(onlineUsers.keys()));
    
    // Broadcast online status to all users
    io.emit('user-status', { userId, status: 'online' });
  });

  // Handle sending messages
  socket.on('send-message', async (data) => {
    try {
      console.log('📨 Received send-message event:', data);
      const { sender, receiver, content, type } = data;
      
      if (!sender || !receiver || !content) {
        console.error('❌ Missing required fields:', { sender, receiver, content });
        socket.emit('message-error', { error: 'Missing required fields' });
        return;
      }
      
      // Create conversation ID (sorted to ensure consistency)
      const conversationId = [sender, receiver].sort().join('_');
      
      // Save message to database
      const message = new Message({
        conversationId,
        sender,
        receiver,
        content,
        type: type || 'text',
        timestamp: new Date()
      });
      
      await message.save();
      console.log('✅ Message saved to DB:', message._id);
      
      const messageData = {
        _id: message._id,
        id: message._id,
        conversationId: message.conversationId,
        sender: message.sender,
        receiver: message.receiver,
        content: message.content,
        timestamp: message.timestamp,
        read: message.read,
        type: message.type
      };
      
      // Send to receiver if online
      const receiverSocketId = onlineUsers.get(receiver);
      console.log('Receiver socket ID:', receiverSocketId, 'Online users:', Array.from(onlineUsers.keys()));
      
      if (receiverSocketId) {
        console.log('📤 Sending message to receiver:', receiver);
        io.to(receiverSocketId).emit('receive-message', messageData);
        
        // Send notification event to receiver
        io.to(receiverSocketId).emit('new-chat-notification', {
          sender: message.sender,
          content: message.content,
          timestamp: message.timestamp
        });
      } else {
        console.log('⚠️ Receiver not online:', receiver);
      }
      
      // Confirm to sender
      console.log('✅ Sending confirmation to sender');
      socket.emit('message-sent', messageData);
      
      // Also send notification to sender to update their conversation list
      const senderSocketId = onlineUsers.get(sender);
      if (senderSocketId) {
        console.log('📤 Sending conversation update notification to sender:', sender);
        io.to(senderSocketId).emit('new-chat-notification', {
          sender: message.sender,
          receiver: message.receiver,
          content: message.content,
          timestamp: message.timestamp
        });
      }
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      socket.emit('message-error', { error: error.message });
    }
  });

  // Handle typing indicator
  socket.on('typing', (data) => {
    const { receiver } = data;
    const receiverSocketId = onlineUsers.get(receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-typing', { userId: socket.userId });
    }
  });

  // Handle stop typing
  socket.on('stop-typing', (data) => {
    const { receiver } = data;
    const receiverSocketId = onlineUsers.get(receiver);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user-stop-typing', { userId: socket.userId });
    }
  });

  // Handle disconnect
  socket.on('disconnect', () => {
    if (socket.userId) {
      onlineUsers.delete(socket.userId);
      console.log(`👤 User ${socket.userId} disconnected`);
      
      // Broadcast offline status
      io.emit('user-status', { userId: socket.userId, status: 'offline' });
    }
    console.log('🔌 User disconnected:', socket.id);
  });
});

// CORS Configuration
app.use(cors({
  origin: [
    "http://localhost:5000",
    "http://localhost:5173", 
    "http://localhost:5174", 
    "http://localhost:8080",
    "http://localhost:8081"
  ],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));
app.use('/uploads/profiles', express.static('uploads/profiles'));

// Make io and onlineUsers available to routes
app.set('io', io);
app.set('onlineUsers', onlineUsers);

// Routes
app.use("/api", authRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/chat", chatRequestRoutes);
app.use("/api", resourceRoutes);




// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mentor";

mongoose.connect(MONGO_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch(err => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// Server Setup
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket available at http://localhost:${PORT}`);
});

// Register global exception handlers
registerGlobalHandlers({ server, mongooseConnection: mongoose.connection });

// Email Configuration (Nodemailer)
const setupEmailTransporter = () => {
  const hasMailCreds = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;
  
  if (hasMailCreds && nodemailer) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: Boolean(process.env.SMTP_SECURE === "true"),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
      });
      app.set("mailTransporter", transporter);
      console.log("📧 Email transporter configured");
    } catch (error) {
      console.warn("⚠️  Email transporter setup failed:", error.message);
      console.log("📧 OTPs will be logged to console");
    }
  } else {
    console.log("📧 Email transporter not configured; OTPs will be logged to console");
  }
};

// SMS Configuration (Twilio)
const setupSmsClient = () => {
  const twilioSid = process.env.TWILIO_ACCOUNT_SID || "";
  const twilioToken = process.env.TWILIO_AUTH_TOKEN || "";
  const twilioFrom = process.env.TWILIO_FROM_NUMBER || "";
  
  const looksLikeSid = /^AC[0-9a-f]{32}$/i.test(twilioSid);
  const looksLikeToken = /^[0-9a-f]{32}$/i.test(twilioToken);
  const hasValidTwilio = looksLikeSid && looksLikeToken && /^\+\d{7,15}$/.test(twilioFrom);

  if (hasValidTwilio && twilio) {
    try {
      const client = twilio(twilioSid, twilioToken);
      app.set("smsClient", client);
      console.log("📱 Twilio SMS client configured");
    } catch (error) {
      console.warn("⚠️  Twilio setup failed:", error.message);
      console.log("📱 SMS OTPs will be logged to console");
    }
  } else {
    if (twilioSid || twilioToken || twilioFrom) {
      console.warn("⚠️  Twilio env vars present but invalid; expected SID to start with 'AC' and from number to be E.164");
    }
    console.log("📱 Twilio client not configured; SMS OTPs will be logged to console");
  }
};

// Initialize services
setupEmailTransporter();
setupSmsClient();

// Error Handlers (Must be last)
app.use(notFoundHandler);
app.use(errorHandler);


