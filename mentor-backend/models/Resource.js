const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  mentorEmail: {
    type: String,
    required: true
  },
  mentorName: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['file', 'link'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    enum: ['course', 'article', 'assignment', 'repository', 'tool', 'other'],
    default: 'other'
  },
  // For links
  url: {
    type: String
  },
  // For files
  fileName: {
    type: String
  },
  fileSize: {
    type: Number
  },
  fileType: {
    type: String
  },
  filePath: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
resourceSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Resource', resourceSchema);
