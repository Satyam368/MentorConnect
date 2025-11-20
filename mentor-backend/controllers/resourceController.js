const Resource = require('../models/Resource');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// Create a new resource (link or file)
exports.createResource = async (req, res) => {
  try {
    const { title, url, description, category, type, fileName, fileSize, fileType, filePath } = req.body;
    
    // Get mentor info from the authenticated user (assuming you have auth middleware)
    // For now, we'll get it from the request body or session
    const mentorEmail = req.body.mentorEmail || req.user?.email;
    const mentorName = req.body.mentorName || req.user?.name;
    const mentorId = req.body.mentorId || req.user?._id;

    if (!mentorEmail || !mentorName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mentor information is required' 
      });
    }

    const resourceData = {
      mentorEmail,
      mentorName,
      title,
      description: description || '',
      category: category || 'other',
      type: type || 'link'
    };

    // Only add mentorId if it's a valid value
    if (mentorId && mentorId !== '' && mentorId !== 'undefined') {
      resourceData.mentorId = mentorId;
    }

    if (type === 'link') {
      if (!url) {
        return res.status(400).json({ 
          success: false, 
          message: 'URL is required for link resources' 
        });
      }
      resourceData.url = url;
    } else if (type === 'file') {
      if (!fileName || !filePath) {
        return res.status(400).json({ 
          success: false, 
          message: 'File information is required for file resources' 
        });
      }
      resourceData.fileName = fileName;
      resourceData.fileSize = fileSize;
      resourceData.fileType = fileType;
      resourceData.filePath = filePath;
    }

    const resource = new Resource(resourceData);
    await resource.save();

    res.status(201).json({
      success: true,
      message: 'Resource created successfully',
      resource
    });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create resource',
      error: error.message
    });
  }
};

// Upload file resource
exports.uploadFileResource = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { title, description, category } = req.body;
    const mentorEmail = req.body.mentorEmail;
    const mentorName = req.body.mentorName;
    const mentorId = req.body.mentorId;

    if (!mentorEmail || !mentorName || !title) {
      // Delete uploaded file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Mentor information and title are required'
      });
    }

    // Create resource with file information
    const resourceData = {
      mentorEmail,
      mentorName,
      type: 'file',
      title,
      description: description || '',
      category: category || 'other',
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      filePath: req.file.path
    };

    // Only add mentorId if it's a valid value
    if (mentorId && mentorId !== '' && mentorId !== 'undefined') {
      resourceData.mentorId = mentorId;
    }

    const resource = new Resource(resourceData);

    await resource.save();

    res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      resource
    });
  } catch (error) {
    // Delete uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload file',
      error: error.message
    });
  }
};

// Get all resources for a mentor
exports.getMentorResources = async (req, res) => {
  try {
    const { mentorEmail } = req.params;

    if (!mentorEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Mentor email is required' 
      });
    }

    const resources = await Resource.find({ mentorEmail })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: resources.length,
      resources
    });
  } catch (error) {
    console.error('Error fetching mentor resources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resources',
      error: error.message
    });
  }
};

// Get all resources (for students to browse)
exports.getAllResources = async (req, res) => {
  try {
    const { category, type } = req.query;
    const filter = {};

    if (category) filter.category = category;
    if (type) filter.type = type;

    const resources = await Resource.find(filter)
      .sort({ createdAt: -1 })
      .limit(100);

    res.status(200).json({
      success: true,
      count: resources.length,
      resources
    });
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resources',
      error: error.message
    });
  }
};

// Delete a resource
exports.deleteResource = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const resource = await Resource.findByIdAndDelete(resourceId);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Delete physical file if it's a file resource
    if (resource.type === 'file' && resource.filePath) {
      try {
        if (fs.existsSync(resource.filePath)) {
          fs.unlinkSync(resource.filePath);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue even if file deletion fails
      }
    }

    res.status(200).json({
      success: true,
      message: 'Resource deleted successfully',
      resource
    });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resource',
      error: error.message
    });
  }
};

// Update a resource
exports.updateResource = async (req, res) => {
  try {
    const { resourceId } = req.params;
    const updates = req.body;

    const resource = await Resource.findByIdAndUpdate(
      resourceId,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Resource updated successfully',
      resource
    });
  } catch (error) {
    console.error('Error updating resource:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resource',
      error: error.message
    });
  }
};

// Download a file resource
exports.downloadFile = async (req, res) => {
  try {
    const { resourceId } = req.params;

    const resource = await Resource.findById(resourceId);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    if (resource.type !== 'file') {
      return res.status(400).json({
        success: false,
        message: 'This resource is not a file'
      });
    }

    if (!fs.existsSync(resource.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File not found on server'
      });
    }

    // Send file for download
    res.download(resource.filePath, resource.fileName, (err) => {
      if (err) {
        console.error('Error downloading file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Failed to download file'
          });
        }
      }
    });
  } catch (error) {
    console.error('Error downloading file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download file',
      error: error.message
    });
  }
};
