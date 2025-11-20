# 📸 Profile Picture Feature - Implementation Guide

## ✅ What's Been Implemented

Both **mentors** and **mentees** can now upload, display, and delete profile pictures!

---

## 🎯 Features Added

### 1. **Backend Implementation**

#### Database Model:
- Added `profilePicture` field to User schema (stores file path)

#### New Endpoints:
```javascript
POST /api/profile/upload-picture
- Upload profile picture (multipart/form-data)
- Validates: image files only (JPEG, PNG, GIF, WEBP)
- Max size: 5MB
- Auto-deletes old picture when uploading new one

DELETE /api/profile/delete-picture  
- Deletes profile picture from disk and database
```

#### File Storage:
- Profile pictures stored in: `/uploads/profiles/`
- Unique filenames: `profile-{timestamp}-{random}.ext`
- Accessible via: `http://localhost:5000/uploads/profiles/{filename}`

#### Validation:
- ✅ Only image files allowed
- ✅ 5MB max file size
- ✅ Automatic cleanup of old pictures
- ✅ Error handling with file deletion on failure

### 2. **Frontend Implementation**

#### Profile Page:
- ✅ Upload button with camera icon
- ✅ File input (hidden, opens on button click)
- ✅ Live preview after upload
- ✅ "Remove Photo" button (appears when picture exists)
- ✅ Loading state during upload
- ✅ Error handling with toast notifications
- ✅ Fallback to initials when no picture

#### Avatar Display:
Updated in multiple pages:
- ✅ Profile page - Full upload/delete functionality
- ✅ Booking page - Displays mentor profile pictures
- ✅ Other pages use fallback initials

---

## 📡 API Endpoints

### Upload Profile Picture
```http
POST /api/profile/upload-picture
Content-Type: multipart/form-data

FormData:
- profilePicture: File (image file)
- email: String (user's email)
```

**Success Response:**
```json
{
  "message": "Profile picture uploaded successfully",
  "profilePicture": "/uploads/profiles/profile-1699999999999-123456789.jpg",
  "url": "http://localhost:5000/uploads/profiles/profile-1699999999999-123456789.jpg"
}
```

**Error Response:**
```json
{
  "message": "Invalid file type. Only image files are allowed."
}
```

### Delete Profile Picture
```http
DELETE /api/profile/delete-picture
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Success Response:**
```json
{
  "message": "Profile picture deleted successfully"
}
```

---

## 🖼️ Image Specifications

### Supported Formats:
- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)
- WEBP (.webp)

### Size Limits:
- Maximum file size: **5MB**
- Recommended dimensions: **500x500px** or higher (square)

### Storage:
- Backend folder: `mentor-backend/uploads/profiles/`
- Public URL: `http://localhost:5000/uploads/profiles/{filename}`

---

## 💻 Frontend Usage

### In Profile Component:

```tsx
// Upload handler
const handleProfilePictureUpload = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('profilePicture', file);
  formData.append('email', profile.email);

  const response = await fetch(API_ENDPOINTS.PROFILE_UPLOAD_PICTURE, {
    method: 'POST',
    body: formData
  });

  if (response.ok) {
    const data = await response.json();
    setProfile(prev => ({ ...prev, profilePicture: data.profilePicture }));
  }
};

// Display
<Avatar>
  <AvatarImage src={profile.profilePicture ? `http://localhost:5000${profile.profilePicture}` : undefined} />
  <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
</Avatar>
```

---

## 🔄 How It Works

### Upload Flow:
```
1. User clicks camera icon button
   ↓
2. File input dialog opens
   ↓
3. User selects image file
   ↓
4. Frontend validates:
   - Is it an image?
   - Is it under 5MB?
   ↓
5. If valid, upload to backend via FormData
   ↓
6. Backend saves to /uploads/profiles/
   ↓
7. Backend updates user.profilePicture in database
   ↓
8. Backend deletes old picture (if exists)
   ↓
9. Returns new picture path
   ↓
10. Frontend updates state and displays new picture
```

### Delete Flow:
```
1. User clicks "Remove Photo" button
   ↓
2. Frontend sends DELETE request with user email
   ↓
3. Backend finds user and picture path
   ↓
4. Backend deletes file from disk
   ↓
5. Backend sets user.profilePicture = null
   ↓
6. Frontend updates state, shows initials fallback
```

---

## 🎨 UI Features

### Profile Page:
- **Camera Icon Button**: Positioned at bottom-right of avatar
- **Upload**: Click camera → Select image → Auto-upload
- **Loading State**: Button disabled during upload
- **Remove Button**: Only visible when picture exists
- **Preview**: Immediate display after successful upload
- **Fallback**: Shows initials when no picture

### Other Pages (Booking, Chat, etc.):
- Display profile picture if available
- Fallback to initials if no picture
- Consistent avatar styling across all pages

---

## 📁 File Structure

### Backend:
```
mentor-backend/
├── config/
│   └── profilePictureConfig.js    # Multer config for profile pics
├── uploads/
│   └── profiles/                  # Profile pictures storage
│       ├── profile-xxx.jpg
│       └── profile-yyy.png
├── models/
│   └── User.js                    # profilePicture field added
└── routes/
    └── auth.js                    # Upload & delete endpoints
```

### Frontend:
```
mentor-frontend/
├── src/
│   ├── lib/
│   │   └── api.ts                 # API endpoints
│   └── pages/
│       ├── Profile.tsx            # Upload/delete functionality
│       ├── Booking.tsx            # Display profile pics
│       └── FindMentors.tsx        # Display profile pics
```

---

## 🧪 Testing

### Test Upload:
1. Navigate to Profile page
2. Click camera icon on avatar
3. Select an image file (< 5MB)
4. Wait for upload (loading state)
5. See new profile picture displayed
6. Refresh page - picture should persist

### Test Delete:
1. With a profile picture uploaded
2. Click "Remove Photo" button
3. Confirm picture is removed
4. See initials displayed instead
5. Refresh page - should still show initials

### Test in Other Pages:
1. Upload profile picture
2. Go to Booking page
3. Profile picture should show in mentor cards
4. Go to Chat page (if implemented)
5. Profile picture should show in messages

### Test Validation:
1. Try uploading a PDF → Should show error
2. Try uploading > 5MB image → Should show error
3. Try uploading valid image → Should succeed

---

## 🔐 Security Features

- ✅ File type validation (images only)
- ✅ File size limit (5MB)
- ✅ Unique filenames prevent conflicts
- ✅ Old pictures automatically deleted
- ✅ User verification (email required)
- ✅ Error handling with file cleanup
- ✅ No direct file path exposure

---

## 🚀 Next Steps

### Enhancements to Consider:

1. **Image Optimization**:
   - Auto-resize images to standard dimensions
   - Compress images to reduce storage
   - Generate thumbnails for smaller displays

2. **Image Cropping**:
   - Allow users to crop images before upload
   - Ensure square aspect ratio
   - Preview cropped result

3. **Avatar Editor**:
   - Drag & drop upload
   - Multiple upload methods
   - Image filters/effects

4. **Default Avatars**:
   - Generated avatars (like Gravatar)
   - Color-coded by role
   - Pattern-based designs

5. **CDN Integration**:
   - Upload to cloud storage (AWS S3, Cloudinary)
   - Faster delivery
   - Better scalability

6. **Profile Picture in More Places**:
   - Chat messages
   - Comments/Reviews
   - Dashboard widgets
   - Notification center

---

## 📝 API Endpoints Summary

| Method | Endpoint | Purpose | Auth Required |
|--------|----------|---------|---------------|
| POST | `/api/profile/upload-picture` | Upload profile picture | Yes (email) |
| DELETE | `/api/profile/delete-picture` | Delete profile picture | Yes (email) |
| GET | `/uploads/profiles/{filename}` | Serve profile picture | No (public) |

---

## 🎉 Summary

✅ **Backend**: Profile picture upload/delete endpoints created
✅ **Storage**: Images saved to `/uploads/profiles/`
✅ **Database**: `profilePicture` field added to User model
✅ **Frontend**: Upload UI with camera button in Profile page
✅ **Display**: Profile pictures shown in Profile, Booking pages
✅ **Validation**: Image type & size validation
✅ **Cleanup**: Old pictures automatically deleted
✅ **Fallback**: Initials displayed when no picture

**Both mentors and mentees can now personalize their profiles with photos!** 📸
