# File Upload Feature Documentation

## Overview
Full file upload functionality has been added to the mentor platform, allowing mentors to upload study materials (PDFs, documents, images, videos, archives) along with sharing links.

## Backend Implementation

### 1. File Upload Configuration (`mentor-backend/config/multerConfig.js`)
- **Storage**: Files are stored in `mentor-backend/uploads/` directory
- **Naming**: Unique filenames with timestamp and random string (e.g., `document-1699876543210-123456789.pdf`)
- **File Size Limit**: 50MB per file
- **Supported Formats**:
  - Documents: PDF, DOC, DOCX, PPT, PPTX, TXT
  - Images: JPG, JPEG, PNG, GIF
  - Videos: MP4, AVI, MOV
  - Archives: ZIP, RAR

### 2. Resource Controller Updates (`mentor-backend/controllers/resourceController.js`)

#### New Functions:
- **`uploadFileResource`**: Handles file uploads via multipart/form-data
  - Validates file upload
  - Stores file metadata in MongoDB
  - Automatically deletes file if validation fails
  - Returns resource details on success

- **`downloadFile`**: Serves file downloads
  - Validates resource exists and is a file
  - Checks physical file exists on disk
  - Streams file to client with proper headers

- **`deleteResource`** (Updated): Now deletes physical files
  - When a file resource is deleted from DB, the physical file is also removed
  - Gracefully handles missing files

### 3. Routes (`mentor-backend/routes/resource.js`)

```javascript
POST   /api/resource/upload              // Upload file (multipart/form-data)
GET    /api/resource/download/:resourceId // Download file
POST   /api/resource                      // Create link resource
GET    /api/resource/mentor/:mentorEmail // Get mentor's resources
GET    /api/resources                     // Get all resources
PUT    /api/resource/:resourceId          // Update resource
DELETE /api/resource/:resourceId          // Delete resource (includes file)
```

### 4. Static File Serving (`mentor-backend/index.js`)
- Files in `/uploads` directory are served statically at `/uploads/*`
- Allows direct file access via URL (for previews, thumbnails, etc.)

## Frontend Implementation

### 1. API Endpoints (`mentor-frontend/src/lib/api.ts`)
Added new endpoints:
- `RESOURCE_UPLOAD`: For uploading files
- `RESOURCE_DOWNLOAD`: For downloading files

### 2. MentorDashboard Updates (`mentor-frontend/src/pages/MentorDashboard.tsx`)

#### File Upload Handler (`handleFilesSelected`)
- Accepts multiple files at once
- Creates FormData for each file
- Uploads files in parallel using Promise.all
- Shows success count and fail count
- Automatically refreshes resource list after upload

#### File Download Handler (`handleDownloadFile`)
- Creates temporary download link
- Triggers browser download
- Removes temporary link after download

#### UI Enhancements:
1. **Resource Display**:
   - Shows file type badge (PDF, DOCX, etc.)
   - Displays file size in MB
   - Download button for file resources
   - Link button for URL resources
   - Delete button for all resources

2. **Upload Section**:
   - Clear instructions for supported formats
   - Multiple file selection
   - Max file size notice (50MB)
   - Visual drop zone with icons

## File Upload Flow

### Upload Process:
1. Mentor clicks "Upload Files" button
2. File picker opens (multiple selection enabled)
3. Mentor selects one or more files
4. Frontend creates FormData for each file with:
   - File blob
   - Title (filename)
   - Description
   - Category
   - Mentor information
5. Files uploaded in parallel to `/api/resource/upload`
6. Multer middleware processes upload:
   - Validates file type
   - Checks file size
   - Generates unique filename
   - Saves to `/uploads` directory
7. Controller saves metadata to MongoDB:
   - File name, size, type, path
   - Mentor information
   - Timestamps
8. Success toast shown with count
9. Resource list automatically refreshes

### Download Process:
1. User clicks "Download" button on a file resource
2. Frontend calls `/api/resource/download/:resourceId`
3. Backend validates resource and file existence
4. File streamed to client with proper headers
5. Browser downloads file with original filename

### Delete Process:
1. Mentor clicks delete (X) button
2. DELETE request sent to `/api/resource/:resourceId`
3. Backend:
   - Removes MongoDB document
   - Deletes physical file from disk
4. Success toast shown
5. Resource list refreshes

## Database Schema

Resource model includes file-specific fields:
```javascript
{
  // Common fields
  mentorId: ObjectId,
  mentorEmail: String,
  mentorName: String,
  type: 'file' | 'link',
  title: String,
  description: String,
  category: String,
  
  // File-specific fields
  fileName: String,        // Original filename
  fileSize: Number,        // Size in bytes
  fileType: String,        // MIME type (e.g., 'application/pdf')
  filePath: String,        // Server path to file
  
  // Link-specific fields
  url: String,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

## Security Considerations

### Current Implementation:
1. ✅ File type validation (whitelist approach)
2. ✅ File size limits (50MB)
3. ✅ Unique filename generation (prevents overwrites)
4. ✅ Automatic cleanup on upload failure

### Recommended Enhancements:
1. **Authentication**: Add JWT or session-based auth middleware
2. **Authorization**: Verify mentor owns resource before delete/update
3. **Virus Scanning**: Integrate antivirus scanning (ClamAV)
4. **Rate Limiting**: Prevent abuse with upload rate limits
5. **Cloud Storage**: Move to AWS S3/Azure Blob for production
6. **CDN**: Use CDN for file delivery at scale

## Testing

### Test File Upload:
1. Start backend: `cd mentor-backend && node index.js`
2. Start frontend: `cd mentor-frontend && npm run dev`
3. Login as mentor
4. Navigate to Resources tab
5. Click "Upload Files"
6. Select test files (PDF, image, etc.)
7. Verify files appear in resource list
8. Check `mentor-backend/uploads/` for files

### Test File Download:
1. Click "Download" on any file resource
2. Verify file downloads with correct name
3. Open downloaded file to verify integrity

### Test File Delete:
1. Click X button on a file resource
2. Verify resource disappears from UI
3. Check `mentor-backend/uploads/` - file should be deleted
4. Check MongoDB - document should be removed

## API Examples

### Upload File
```javascript
const formData = new FormData();
formData.append('file', fileBlob);
formData.append('title', 'My Study Material');
formData.append('description', 'Important notes');
formData.append('category', 'course');
formData.append('mentorEmail', 'mentor@example.com');
formData.append('mentorName', 'John Doe');

const response = await fetch('http://localhost:5000/api/resource/upload', {
  method: 'POST',
  body: formData
});

const data = await response.json();
console.log(data.resource);
```

### Download File
```javascript
// Direct download link
const downloadUrl = `http://localhost:5000/api/resource/download/${resourceId}`;

// Or programmatically
const response = await fetch(downloadUrl);
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = filename;
a.click();
```

### Delete Resource
```javascript
const response = await fetch(`http://localhost:5000/api/resource/${resourceId}`, {
  method: 'DELETE'
});

const data = await response.json();
console.log(data.message); // "Resource deleted successfully"
```

## File Structure
```
mentor-backend/
├── config/
│   └── multerConfig.js       # Multer configuration
├── controllers/
│   └── resourceController.js # File upload/download logic
├── models/
│   └── Resource.js           # Resource schema
├── routes/
│   └── resource.js           # Resource routes
├── uploads/                  # Uploaded files directory (auto-created)
└── index.js                  # Server with static file serving

mentor-frontend/
├── src/
│   ├── lib/
│   │   └── api.ts            # API endpoints
│   └── pages/
│       └── MentorDashboard.tsx # File upload UI
```

## Future Enhancements

1. **File Preview**: 
   - PDF viewer in modal
   - Image thumbnails
   - Video player

2. **Drag & Drop**: 
   - Drag files directly to upload area
   - Visual feedback during drag

3. **Progress Bar**:
   - Show upload progress percentage
   - Cancel upload option

4. **File Organization**:
   - Folders/categories
   - Search and filter
   - Bulk operations

5. **Sharing Controls**:
   - Share with specific students
   - Set expiration dates
   - Password protection

6. **Analytics**:
   - Track download counts
   - View engagement metrics
   - Popular resources

7. **Cloud Storage**:
   - Migrate to AWS S3
   - Use CloudFront CDN
   - Implement signed URLs

## Troubleshooting

### Issue: "Invalid file type" error
**Solution**: Check file extension matches allowed types in `multerConfig.js`

### Issue: "File too large" error
**Solution**: File exceeds 50MB limit. Increase limit in multerConfig or compress file

### Issue: Upload succeeds but file not saved
**Solution**: Check `uploads/` directory exists and has write permissions

### Issue: Download fails
**Solution**: Verify file path in MongoDB matches actual file location

### Issue: Delete succeeds but file remains
**Solution**: Check file system permissions for delete operation

## Performance Considerations

- **Multiple File Uploads**: Uses Promise.all for parallel uploads (faster than sequential)
- **File Streaming**: Downloads use streaming for memory efficiency
- **Database Indexing**: Resource queries indexed by mentorEmail and createdAt
- **Static File Serving**: Express static middleware for efficient file delivery

## Monitoring

Check server logs for:
- Upload success/failure
- File deletion operations
- Download requests
- Storage space usage

Monitor `uploads/` directory size:
```bash
du -sh uploads/
```

## Maintenance

Recommended periodic tasks:
1. Clean up orphaned files (files without DB records)
2. Back up uploads directory
3. Monitor disk space usage
4. Review and archive old resources
