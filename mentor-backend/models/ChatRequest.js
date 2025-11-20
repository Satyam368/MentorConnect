const mongoose = require('mongoose');

const chatRequestSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    index: true
  },
  receiver: {
    type: String,
    required: true,
    index: true
  },
  message: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'declined'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date
  }
});

// Index for efficient queries
chatRequestSchema.index({ receiver: 1, status: 1 });
chatRequestSchema.index({ sender: 1, receiver: 1 });

const ChatRequest = mongoose.model('ChatRequest', chatRequestSchema);

module.exports = ChatRequest;
