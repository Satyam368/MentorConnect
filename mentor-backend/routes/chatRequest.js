const express = require('express');
const router = express.Router();
const chatRequestController = require('../controllers/chatRequestController');

// Create a chat request
router.post('/request', chatRequestController.createChatRequest);

// Get pending requests for a user
router.get('/requests/pending/:userId', chatRequestController.getPendingRequests);

// Get all requests for a user
router.get('/requests/:userId', chatRequestController.getAllRequests);

// Approve a request
router.put('/request/:requestId/approve', chatRequestController.approveRequest);

// Decline a request
router.put('/request/:requestId/decline', chatRequestController.declineRequest);

// Check chat permission
router.get('/permission/:sender/:receiver', chatRequestController.checkChatPermission);

module.exports = router;
