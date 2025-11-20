# Study Materials Feature

## Overview
Mentors can now upload and share study materials (links) with their students. The uploaded resources are stored in MongoDB and displayed in real-time on the Mentor Dashboard.

## Features Implemented

### Backend
1. **Resource Model** (`mentor-backend/models/Resource.js`)
   - Stores resource information (title, description, URL, category, type)
   - Tracks mentor details (mentorId, mentorEmail, mentorName)
   - Supports both file and link resources
   - Categories: course, article, assignment, repository, tool, other

2. **Resource Controller** (`mentor-backend/controllers/resourceController.js`)
   - `createResource` - Create new study material
   - `getMentorResources` - Get all resources for a specific mentor
   - `getAllResources` - Get all resources (for students to browse)
   - `updateResource` - Update existing resource
   - `deleteResource` - Delete a resource

3. **Resource Routes** (`mentor-backend/routes/resource.js`)
   - POST `/api/resource` - Create resource
   - GET `/api/resource/mentor/:mentorEmail` - Get mentor's resources
   - GET `/api/resources` - Get all resources
   - PUT `/api/resource/:resourceId` - Update resource
   - DELETE `/api/resource/:resourceId` - Delete resource

### Frontend
1. **API Endpoints** (`mentor-frontend/src/lib/api.ts`)
   - Added resource endpoints for CRUD operations

2. **Mentor Dashboard** (`mentor-frontend/src/pages/MentorDashboard.tsx`)
   - **Resources Display Section**: Shows all uploaded study materials
     - Resource count badge
     - Empty state when no resources
     - Loading state while fetching
     - Each resource card shows:
       - Title and category badge
       - Description
       - Clickable URL (opens in new tab)
       - Creation date
       - Delete button
   
   - **Share Study Links Form**: Allows mentors to add new resources
     - Title input
     - URL input
     - Description textarea
     - Category selector (course, article, assignment, repository, tool, other)
     - Share button with validation

## How It Works

### Sharing a Resource
1. Mentor fills out the "Share Study Links" form
2. Enters title, URL, description, and selects a category
3. Clicks "Share Link" button
4. Resource is saved to MongoDB with mentor information
5. Toast notification confirms success
6. Resources list automatically refreshes to show the new resource

### Viewing Resources
1. When mentor opens the Resources tab, `fetchResources()` is called
2. Backend fetches all resources for that mentor's email
3. Resources are displayed in a list with all details
4. Each resource shows type icon (link/file), title, category, description, URL, and date

### Deleting a Resource
1. Mentor clicks the X button on a resource card
2. DELETE request sent to backend
3. Resource removed from MongoDB
4. Toast notification confirms deletion
5. Resources list automatically refreshes

## Database Schema

```javascript
{
  mentorId: ObjectId,
  mentorEmail: String (required),
  mentorName: String (required),
  type: String (enum: ['file', 'link']),
  title: String (required),
  description: String,
  category: String (enum: ['course', 'article', 'assignment', 'repository', 'tool', 'other']),
  url: String (for links),
  fileName: String (for files),
  fileSize: Number (for files),
  fileType: String (for files),
  filePath: String (for files),
  createdAt: Date,
  updatedAt: Date
}
```

## Next Steps (Optional Enhancements)

1. **File Upload Support**: Currently only links are supported. You can add:
   - File upload to cloud storage (AWS S3, Cloudinary, etc.)
   - File preview functionality
   - Download links for files

2. **Student View**: Create a page where students can:
   - Browse all available resources from their mentors
   - Filter by category
   - Search resources by title/description
   - Bookmark favorite resources

3. **Resource Analytics**: Track:
   - Number of views per resource
   - Number of downloads
   - Student engagement metrics

4. **Access Control**: Add:
   - Private/public resource visibility
   - Share resources with specific students only
   - Scheduled publishing (available from/until dates)

## Testing

1. Start the backend server:
   ```bash
   cd mentor-backend
   node index.js
   ```

2. Start the frontend:
   ```bash
   cd mentor-frontend
   npm run dev
   ```

3. Login as a mentor and navigate to the Resources tab
4. Share a study link and verify it appears in the list
5. Delete a resource and verify it's removed
6. Check MongoDB to confirm data persistence

## API Examples

### Create a Resource
```javascript
POST /api/resource
Content-Type: application/json

{
  "title": "React Documentation",
  "url": "https://react.dev",
  "description": "Official React docs for learning",
  "category": "course",
  "type": "link",
  "mentorEmail": "mentor@example.com",
  "mentorName": "John Doe",
  "mentorId": "507f1f77bcf86cd799439011"
}
```

### Get Mentor's Resources
```javascript
GET /api/resource/mentor/mentor@example.com
```

### Delete a Resource
```javascript
DELETE /api/resource/:resourceId
```
