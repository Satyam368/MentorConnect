# Profile Edit Feature - Debugging Guide

## ✅ What Was Implemented

### 1. Certificate Upload
- **File Upload Button**: Click "Upload Certificate" to select certificate files
- **Supported Formats**: .pdf, .jpg, .jpeg, .png, .doc, .docx
- **Manual Entry**: Type certificate name and press Enter
- **Remove**: Click X button on any certificate badge when editing

### 2. Expertise Dropdown
- **Predefined Options**:
  - Web Development
  - Mobile Development
  - Data Science
  - Machine Learning
  - Artificial Intelligence
  - DevOps
  - Cloud Computing
  - Cybersecurity
  - Blockchain
  - UI/UX Design
  - Product Management
  - Digital Marketing
  - Game Development
  - IoT
  - Other

### 3. Custom Expertise Input
- When "Other" is selected, a text input appears
- Type your custom expertise area
- Automatically shown for non-standard expertise values

## 🔍 How to Test

### Step 1: Login as Mentor
1. Go to http://localhost:8081
2. Login with mentor credentials: `satyamsinghal124@gmail.com`

### Step 2: Navigate to Dashboard
1. Click on "Dashboard" in navigation
2. Click on "Profile Management" tab

### Step 3: Edit Profile
1. Click "Edit Profile" button (bottom right)
2. All fields should become editable

### Step 4: Test Expertise Dropdown
1. Click on the Expertise dropdown
2. Select an option (e.g., "Web Development")
3. The profile.expertise should update

#### Test Custom Expertise:
1. Select "Other" from dropdown
2. A text input should appear below
3. Type custom expertise (e.g., "Quantum Computing")
4. The profile.expertise should update with your custom value

### Step 5: Test Certificate Upload
1. Click "Upload Certificate" button
2. Select a certificate file from your computer
3. Certificate name (without extension) should appear as a badge
4. You can add multiple certificates

#### Test Manual Certificate Entry:
1. In the "Or type certificate name and press Enter" field
2. Type a certificate name (e.g., "AWS Certified Developer")
3. Press Enter
4. Badge should appear

### Step 6: Remove Certificates
1. Hover over any certificate badge
2. Click the X button
3. Certificate should be removed from the list

### Step 7: Save Changes
1. Click "Save Changes" button
2. Check browser console (F12) for logs:
   - "handleProfileUpdate called"
   - "Current profile state: {...}"
   - "User email: ..."
   - "Sending profile data: {...}"
   - "Response status: 200"
   - "Response data: {...}"

### Step 8: Verify Save
1. A toast notification should appear: "Profile updated!"
2. Click "Edit Profile" again to verify changes were saved
3. Refresh the page and check if data persists

## 🐛 Debugging Checklist

### If "Save Changes" doesn't work:

#### 1. Check Browser Console (F12)
Look for these console logs in order:
```
handleProfileUpdate called
Current profile state: { name: "...", expertise: "...", certifications: [...], ... }
User email: satyamsinghal124@gmail.com
Sending profile data: { ... }
Response status: 200 (or error code)
Response data: { message: "Profile updated successfully", ... }
```

#### 2. Common Issues & Solutions:

**Issue: Nothing happens when clicking "Save Changes"**
- Solution: Check if `isEditing` state is true
- Verify button has `type="button"` attribute
- Check browser console for JavaScript errors

**Issue: Console shows "Response status: 400"**
- Solution: Email is missing from localStorage
- Check: `localStorage.getItem('authUser')`
- Should contain email field

**Issue: Console shows "Response status: 404"**
- Solution: User not found in database
- Verify user exists with correct email
- Check MongoDB connection

**Issue: Console shows "Response status: 500"**
- Solution: Server error
- Check backend terminal for error messages
- Verify MongoDB is running

**Issue: Expertise dropdown doesn't show custom input**
- Solution: Make sure "Other" is selected
- Check `selectedExpertise` state value
- Custom input should appear when: `selectedExpertise === "Other"`

**Issue: Certificate upload doesn't add badge**
- Solution: Check `handleCertificateSelect` function
- Verify `addCertification` is called
- Check `profile.certifications` array in state

**Issue: Pressing Enter in certificate input doesn't add**
- Solution: Event.preventDefault() should be called
- Check `e.key === 'Enter'` condition
- Verify `addCertification` function

#### 3. Network Tab Check (F12 → Network)
When you click "Save Changes":
1. Should see POST request to `http://localhost:5000/api/profile`
2. Request Headers should include `Content-Type: application/json`
3. Request Payload should contain all profile data including:
   - certifications: [...]
   - company: "..." (your expertise)
4. Response should be 200 OK

#### 4. Backend Logs Check
In the backend terminal, you should see:
```
POST /api/profile 200
```

If you see errors, they will be logged there.

## 📝 Code Locations

### Frontend (MentorDashboard.tsx)
- **State**: Lines 17-35 (profile state, expertise states)
- **Certificate Functions**: Lines 577-612
- **Expertise Functions**: Lines 614-625
- **Save Function**: Lines 627-707
- **UI - Expertise Dropdown**: Lines 976-1002
- **UI - Certifications**: Lines 1051-1107
- **UI - Save Button**: Lines 1109-1125

### Backend (routes/auth.js)
- **Profile Update Endpoint**: Lines 601-700

## 🎯 Expected Behavior

### When Editing is Enabled:
- [x] All input fields become editable
- [x] Expertise shows dropdown (not plain input)
- [x] "Upload Certificate" button appears
- [x] Certificate input field appears
- [x] X buttons appear on all badges
- [x] "Save Changes" and "Cancel" buttons appear

### When "Save Changes" is Clicked:
- [x] Console logs show function execution
- [x] POST request sent to `/api/profile`
- [x] Success toast appears
- [x] Edit mode exits (isEditing = false)
- [x] Profile data refreshes
- [x] Changes persist after page refresh

### When Custom Expertise is Used:
- [x] Dropdown set to "Other"
- [x] Text input appears below dropdown
- [x] Input shows current expertise value
- [x] Typing updates profile.expertise

### When Certificate is Uploaded:
- [x] File picker opens
- [x] File selected
- [x] Certificate name extracted (without extension)
- [x] Badge appears with certificate name
- [x] Toast notification shown
- [x] File input reset

## 🚀 Quick Test Commands

### Check if servers are running:
```powershell
# Frontend should be on port 8081
netstat -ano | findstr :8081

# Backend should be on port 5000
netstat -ano | findstr :5000
```

### Check localStorage:
```javascript
// Run in browser console (F12)
console.log(JSON.parse(localStorage.getItem('authUser')));
```

### Test API directly:
```javascript
// Run in browser console (F12)
fetch('http://localhost:5000/api/profile/satyamsinghal124@gmail.com')
  .then(r => r.json())
  .then(console.log);
```

## ✨ Success Criteria

Profile editing is working correctly when:
1. ✅ You can select expertise from dropdown
2. ✅ "Other" option shows custom text input
3. ✅ You can upload certificate files
4. ✅ You can type certificate names manually
5. ✅ You can remove certificates by clicking X
6. ✅ Clicking "Save Changes" sends data to backend
7. ✅ Success toast appears after save
8. ✅ Changes persist after page refresh
9. ✅ All console logs show expected values
10. ✅ No errors in browser console or backend terminal

If all these work, the feature is fully functional! ✅
