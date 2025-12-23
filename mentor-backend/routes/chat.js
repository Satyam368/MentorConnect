const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require("../middleware/authMiddleware");

// Protect all chat routes
router.use(authMiddleware);

// Get conversation between two users
router.get('/conversation/:userId/:otherUserId', chatController.getConversation);

// Get all conversations for a user
router.get('/conversations/:userId', chatController.getUserConversations);

// Get unread messages for a user
router.get('/unread/:userId', chatController.getUnreadMessages);

// Mark messages as read
router.post('/mark-read', chatController.markAsRead);

// Save a message
router.post('/message', chatController.saveMessage);

module.exports = router;
