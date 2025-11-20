const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const upload = require('../config/multerConfig');

// Create a new resource (link only)
router.post('/resource', resourceController.createResource);

// Upload a file resource
router.post('/resource/upload', upload.single('file'), resourceController.uploadFileResource);

// Get all resources for a specific mentor
router.get('/resource/mentor/:mentorEmail', resourceController.getMentorResources);

// Get all resources (for browsing)
router.get('/resources', resourceController.getAllResources);

// Download a file resource
router.get('/resource/download/:resourceId', resourceController.downloadFile);

// Update a resource
router.put('/resource/:resourceId', resourceController.updateResource);

// Delete a resource
router.delete('/resource/:resourceId', resourceController.deleteResource);

module.exports = router;
