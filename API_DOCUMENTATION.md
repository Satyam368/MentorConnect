# API Documentation - Complete CRUD Operations

## Base URL
```
http://localhost:3000/api
```

---

## User Management Endpoints

### Authentication & Registration

#### Health Check
- **GET** `/health`
- **Description**: Check if the API is running
- **Response**: `{ "ok": true }`

#### Register User
- **POST** `/register`
- **Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "student", // or "mentor"
  "phone": "+1234567890", // optional
  "mentor": { // if role is mentor
    "domain": "Web Development",
    "experience": "5 years",
    "hourlyRate": "$50",
    "languages": "English, Spanish",
    "services": "Coding, Career Guidance",
    "availability": "Mon-Fri 9AM-5PM"
  },
  "mentee": { // if role is student
    "targetRole": "Frontend Developer",
    "currentLevel": "Beginner",
    "interests": "React, JavaScript",
    "goals": "Get first job in tech"
  }
}
```

#### Login
- **POST** `/login`
- **Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

### OTP Management

#### Send OTP
- **POST** `/otp/send`
- **Body**:
```json
{
  "channel": "email", // or "phone"
  "email": "john@example.com", // if channel is email
  "phone": "+1234567890" // if channel is phone
}
```

#### Verify OTP
- **POST** `/otp/verify`
- **Body**:
```json
{
  "channel": "email", // or "phone"
  "email": "john@example.com", // if channel is email
  "phone": "+1234567890", // if channel is phone
  "otp": "123456"
}
```

#### Resend OTP
- **POST** `/otp/resend`
- **Body**: Same as Send OTP

### User CRUD Operations

#### Get All Users (Debug)
- **GET** `/users`
- **Description**: Get all users with basic info

#### Get User by ID
- **GET** `/users/:id`
- **Description**: Get specific user by ID
- **Example**: `/users/507f1f77bcf86cd799439011`

#### Get User by Email
- **GET** `/user?email=john@example.com`
- **Description**: Get user by email address

#### Update User
- **PUT** `/users/:id`
- **Body**:
```json
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "phone": "+1234567890",
  "role": "mentor",
  "mentor": {
    "domain": "Updated Domain",
    "experience": "6 years",
    "hourlyRate": "$60",
    "languages": "English, French",
    "services": "Advanced Coding, Leadership",
    "availability": "Mon-Fri 10AM-6PM"
  }
}
```

#### Update User Password
- **PUT** `/users/:id/password`
- **Body**:
```json
{
  "currentPassword": "oldpassword123",
  "newPassword": "newpassword123"
}
```

#### Delete User
- **DELETE** `/users/:id`
- **Description**: Permanently delete a user

#### Get All Mentors
- **GET** `/mentors`
- **Description**: Get all users with role "mentor"

#### Get All Students
- **GET** `/students`
- **Description**: Get all users with role "student"

---

## Booking Management Endpoints

### Booking CRUD Operations

#### Create Booking
- **POST** `/bookings`
- **Body**:
```json
{
  "userId": "507f1f77bcf86cd799439011",
  "mentorName": "Jane Smith",
  "sessionType": "One-on-One Mentoring",
  "duration": "1 hour",
  "date": "2024-01-15",
  "time": "2:00 PM",
  "notes": "Need help with React components",
  "cost": 50
}
```

#### Get All Bookings (Admin/Debug)
- **GET** `/bookings`
- **Description**: Get all bookings with user details

#### Get Bookings for Specific User
- **GET** `/bookings/user/:userId`
- **Description**: Get all bookings for a specific user
- **Example**: `/bookings/user/507f1f77bcf86cd799439011`

#### Get Single Booking by ID
- **GET** `/bookings/booking/:id`
- **Description**: Get specific booking details
- **Example**: `/bookings/booking/507f1f77bcf86cd799439011`

#### Update Booking
- **PUT** `/bookings/booking/:id`
- **Body**:
```json
{
  "mentorName": "Updated Mentor",
  "sessionType": "Group Session",
  "duration": "2 hours",
  "date": "2024-01-20",
  "time": "3:00 PM",
  "notes": "Updated requirements",
  "cost": 75,
  "status": "confirmed"
}
```

#### Update Booking Status Only
- **PATCH** `/bookings/booking/:id/status`
- **Body**:
```json
{
  "status": "confirmed" // pending, confirmed, or cancelled
}
```

#### Delete Booking
- **DELETE** `/bookings/booking/:id`
- **Description**: Permanently delete a booking

#### Get Bookings by Mentor
- **GET** `/bookings/mentor/:mentorName`
- **Description**: Get all bookings for a specific mentor
- **Example**: `/bookings/mentor/Jane%20Smith`

#### Get Bookings by Date Range
- **GET** `/bookings/date-range?startDate=2024-01-01&endDate=2024-01-31`
- **Description**: Get bookings within a date range
- **Query Parameters**:
  - `startDate`: Start date (YYYY-MM-DD)
  - `endDate`: End date (YYYY-MM-DD)

---

## Response Formats

### Success Response
```json
{
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "message": "Error description",
  "details": "Additional error details (if available)"
}
```

---

## Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request (validation errors)
- **401**: Unauthorized (invalid credentials)
- **403**: Forbidden (verification required)
- **404**: Not Found
- **500**: Internal Server Error

---

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique),
  password: String (required, hashed),
  role: String (enum: ["student", "mentor"], default: "student"),
  phone: String,
  isEmailVerified: Boolean (default: false),
  isPhoneVerified: Boolean (default: false),
  mentor: {
    domain: String,
    experience: String,
    hourlyRate: String,
    languages: String,
    services: String,
    availability: String
  },
  mentee: {
    targetRole: String,
    currentLevel: String,
    interests: String,
    goals: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Model
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: "User", required),
  mentorName: String (required),
  sessionType: String (required),
  duration: String (required),
  date: Date (required),
  time: String (required),
  notes: String,
  cost: Number (required),
  status: String (enum: ["pending", "confirmed", "cancelled"], default: "pending"),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Testing Examples

### Using curl:

#### Create a user:
```bash
curl -X POST http://localhost:3000/api/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "password": "password123",
    "role": "student"
  }'
```

#### Create a booking:
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "USER_ID_HERE",
    "mentorName": "Jane Smith",
    "sessionType": "Career Guidance",
    "duration": "1 hour",
    "date": "2024-01-15",
    "time": "2:00 PM",
    "cost": 50
  }'
```

#### Update a booking:
```bash
curl -X PUT http://localhost:3000/api/bookings/booking/BOOKING_ID_HERE \
  -H "Content-Type: application/json" \
  -d '{
    "status": "confirmed",
    "notes": "Confirmed session"
  }'
```

---

## Notes

1. **Authentication**: Currently using simple session management. Consider implementing JWT tokens for production.
2. **Validation**: All endpoints include input validation and error handling.
3. **Population**: Booking endpoints automatically populate user details where relevant.
4. **Filtering**: User update endpoints prevent modification of sensitive fields like passwords (use dedicated password endpoint).
5. **OTP**: OTP codes are logged to console in development. Configure SMTP/Twilio for production.