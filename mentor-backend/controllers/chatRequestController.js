const ChatRequest = require('../models/ChatRequest');
const User = require('../models/User');

// Create a chat request
exports.createChatRequest = async (req, res) => {
  try {
    const { sender, receiver, message } = req.body;
    
    if (!sender || !receiver) {
      return res.status(400).json({ message: 'Sender and receiver are required' });
    }
    
    // Check if request already exists
    const existingRequest = await ChatRequest.findOne({
      sender,
      receiver,
      status: { $in: ['pending', 'approved'] }
    });
    
    if (existingRequest) {
      if (existingRequest.status === 'approved') {
        return res.status(200).json({ 
          message: 'Chat already approved',
          request: existingRequest,
          canChat: true
        });
      }
      return res.status(200).json({ 
        message: 'Request already pending',
        request: existingRequest,
        canChat: false
      });
    }
    
    const chatRequest = new ChatRequest({
      sender,
      receiver,
      message: message || ''
    });
    
    await chatRequest.save();
    console.log('✅ Chat request created:', chatRequest._id);
    
    // Emit socket event to notify the receiver
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const receiverSocketId = onlineUsers.get(receiver);
    
    if (receiverSocketId && io) {
      // Get sender details
      const senderUser = await User.findOne({ email: sender });
      io.to(receiverSocketId).emit('new-chat-request', {
        requestId: chatRequest._id,
        sender,
        senderName: senderUser?.name || sender,
        message: message || '',
        timestamp: chatRequest.createdAt
      });
      console.log('📤 Chat request notification sent to:', receiver);
    }
    
    res.status(201).json({
      message: 'Chat request sent successfully',
      request: chatRequest,
      canChat: false
    });
  } catch (error) {
    console.error('❌ Error creating chat request:', error);
    res.status(500).json({ message: 'Error creating chat request', error: error.message });
  }
};

// Get all pending requests for a user (mentor)
exports.getPendingRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const requests = await ChatRequest.find({
      receiver: userId,
      status: 'pending'
    }).sort({ createdAt: -1 });
    
    console.log('📋 Found pending requests:', requests.length);
    
    res.status(200).json(requests);
  } catch (error) {
    console.error('❌ Error fetching pending requests:', error);
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};

// Get all requests (sent and received)
exports.getAllRequests = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const requests = await ChatRequest.find({
      $or: [
        { sender: userId },
        { receiver: userId }
      ]
    }).sort({ createdAt: -1 });
    
    res.status(200).json(requests);
  } catch (error) {
    console.error('❌ Error fetching requests:', error);
    res.status(500).json({ message: 'Error fetching requests', error: error.message });
  }
};

// Approve a chat request
exports.approveRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await ChatRequest.findByIdAndUpdate(
      requestId,
      { 
        status: 'approved',
        respondedAt: new Date()
      },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    console.log('✅ Chat request approved:', requestId);
    
    // Emit socket event to notify the sender (student)
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const senderSocketId = onlineUsers.get(request.sender);
    
    if (senderSocketId && io) {
      // Get mentor details
      const mentorUser = await User.findOne({ email: request.receiver });
      io.to(senderSocketId).emit('chat-request-response', {
        requestId: request._id,
        status: 'approved',
        mentorName: mentorUser?.name || request.receiver,
        receiver: request.receiver,
        timestamp: request.respondedAt
      });
      console.log('📤 Approval notification sent to:', request.sender);
    }
    
    res.status(200).json({
      message: 'Chat request approved',
      request
    });
  } catch (error) {
    console.error('❌ Error approving request:', error);
    res.status(500).json({ message: 'Error approving request', error: error.message });
  }
};

// Decline a chat request
exports.declineRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    
    const request = await ChatRequest.findByIdAndUpdate(
      requestId,
      { 
        status: 'declined',
        respondedAt: new Date()
      },
      { new: true }
    );
    
    if (!request) {
      return res.status(404).json({ message: 'Request not found' });
    }
    
    console.log('❌ Chat request declined:', requestId);
    
    // Emit socket event to notify the sender (student)
    const io = req.app.get('io');
    const onlineUsers = req.app.get('onlineUsers');
    const senderSocketId = onlineUsers.get(request.sender);
    
    if (senderSocketId && io) {
      // Get mentor details
      const mentorUser = await User.findOne({ email: request.receiver });
      io.to(senderSocketId).emit('chat-request-response', {
        requestId: request._id,
        status: 'declined',
        mentorName: mentorUser?.name || request.receiver,
        receiver: request.receiver,
        timestamp: request.respondedAt
      });
      console.log('📤 Decline notification sent to:', request.sender);
    }
    
    res.status(200).json({
      message: 'Chat request declined',
      request
    });
  } catch (error) {
    console.error('❌ Error declining request:', error);
    res.status(500).json({ message: 'Error declining request', error: error.message });
  }
};

// Check if chat is allowed between two users
exports.checkChatPermission = async (req, res) => {
  try {
    const { sender, receiver } = req.params;
    
    const approvedRequest = await ChatRequest.findOne({
      sender,
      receiver,
      status: 'approved'
    });
    
    res.status(200).json({
      canChat: !!approvedRequest,
      request: approvedRequest
    });
  } catch (error) {
    console.error('❌ Error checking chat permission:', error);
    res.status(500).json({ message: 'Error checking permission', error: error.message });
  }
};
