const Message = require('../models/Message');

// Get conversation history between two users
exports.getConversation = async (req, res) => {
  try {
    const { userId, otherUserId } = req.params;
    
    // Create conversation ID (sorted to ensure consistency)
    const conversationId = [userId, otherUserId].sort().join('_');
    
    const messages = await Message.find({ conversationId })
      .sort({ timestamp: 1 })
      .limit(100);
    
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching conversation', error: error.message });
  }
};

// Get all conversations for a user
exports.getUserConversations = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📋 getUserConversations called for userId:', userId);
    
    // Find all unique conversations with proper unread count
    const messages = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }]
        }
      },
      {
        $sort: { timestamp: -1 }
      },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $first: '$$ROOT' },
          messages: { $push: '$$ROOT' }
        }
      },
      {
        $addFields: {
          unreadCount: {
            $size: {
              $filter: {
                input: '$messages',
                as: 'msg',
                cond: {
                  $and: [
                    { $eq: ['$$msg.receiver', userId] },
                    { $eq: ['$$msg.read', false] }
                  ]
                }
              }
            }
          }
        }
      },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          unreadCount: 1
        }
      },
      {
        $sort: { 'lastMessage.timestamp': -1 }
      }
    ]);
    
    console.log('📊 Found conversations:', messages.length);
    console.log('📦 Conversations data:', JSON.stringify(messages, null, 2));
    
    res.status(200).json(messages);
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations', error: error.message });
  }
};

// Mark messages as read
exports.markAsRead = async (req, res) => {
  try {
    const { conversationId, userId } = req.body;
    
    await Message.updateMany(
      { 
        conversationId,
        receiver: userId,
        read: false
      },
      { 
        $set: { read: true }
      }
    );
    
    res.status(200).json({ message: 'Messages marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error marking messages as read', error: error.message });
  }
};

// Save a new message (used as backup for socket messages)
exports.saveMessage = async (req, res) => {
  try {
    const { sender, receiver, content, type } = req.body;
    
    // Create conversation ID (sorted to ensure consistency)
    const conversationId = [sender, receiver].sort().join('_');
    
    const message = new Message({
      conversationId,
      sender,
      receiver,
      content,
      type: type || 'text'
    });
    
    await message.save();
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error saving message', error: error.message });
  }
};

// Get unread messages for a user
exports.getUnreadMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const unreadMessages = await Message.find({
      receiver: userId,
      read: false
    })
      .sort({ timestamp: -1 })
      .limit(50);
    
    res.status(200).json(unreadMessages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread messages', error: error.message });
  }
};
