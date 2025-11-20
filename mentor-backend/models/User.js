// 1
const mongoose = require("mongoose");
// 2
const mentorSchema = new mongoose.Schema({
  domain: String,
  experience: String,
  hourlyRate: String,
  languages: String,
  services: String,
  availability: String,
  
  // Additional mentor fields
  industries: [String],
  mentorshipFormats: [String],
  
  // Performance metrics
  totalSessions: { type: Number, default: 0 },
  activeStudents: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  
  // Preferences
  maxStudents: { type: Number, default: 10 },
  preferredStudentLevel: [String],
  communicationStyle: String,
  timezone: String,
  
  // Status
  isVerified: { type: Boolean, default: false },
});

// 3
const menteeSchema = new mongoose.Schema({
  targetRole: String,
  currentLevel: String,
  interests: String,
  goals: String,
  
  // Additional student fields
  learningStyle: String,
  portfolioLinks: [String],
  
  // Learning progress
  completedSessions: { type: Number, default: 0 },
  activeMentors: { type: Number, default: 0 },
  hoursLearned: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  
  // Preferences
  preferredMentorTypes: [String],
  preferredCommunicationStyle: String,
  timezone: String,
});

// 4

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    validate: {
      validator: function(email) {
        // Email must contain a valid TLD (.com, .org, .net, etc.)
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
      },
      message: 'Please provide a valid email address with a proper domain (e.g., example@domain.com)'
    }
  },
  password: { 
    type: String, 
    required: true
    // Password validation is done in the route before hashing
  },
  role: { type: String, enum: ["student", "mentor"], default: "student" },
  phone: { 
    type: String,
    validate: {
      validator: function(phone) {
        // Phone number must be exactly 10 digits
        if (!phone) return true; // Phone is optional
        const phoneRegex = /^[0-9]{10}$/;
        return phoneRegex.test(phone);
      },
      message: 'Phone number must be exactly 10 digits (numbers only)'
    }
  },
  
  // Profile fields
  location: String,
  bio: String,
  profilePicture: String, // URL/path to profile picture
  skills: [String],
  languages: [String],
  certifications: [String],
  education: String,
  company: String,
  position: String,
  availability: [String],
  
  // General user metrics and status
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  
  // Verification fields
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  emailOtp: { type: String },
  emailOtpExpiresAt: { type: Date },
  phoneOtp: { type: String },
  phoneOtpExpiresAt: { type: Date },
  
  // Role-specific nested data
  mentor: mentorSchema,
  mentee: menteeSchema,
}, { timestamps: true });

// 5
module.exports = mongoose.model("User", userSchema);
