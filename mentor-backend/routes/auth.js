const express = require("express");
const jwt = require("jsonwebtoken");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const profilePictureUpload = require("../config/profilePictureConfig");
const path = require("path");
const fs = require("fs");
const { sendSMS } = require("../utils/smsService");
const authController = require("../controllers/authController");
const emailService = require("../utils/emailService");
const passport = require("passport");
const authMiddleware = require("../middleware/authMiddleware");

// Google OAuth Routes
router.get("/auth/google", (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(503).json({ message: "Google Auth not configured on server" });
  }
  passport.authenticate("google", { scope: ["profile", "email"], session: false })(req, res, next);
});

router.get("/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login", session: false }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    const frontendUrl = "http://localhost:5173"; // Hardcoded for now as per env
    res.redirect(`${frontendUrl}/login?userId=${user._id}&loginSuccess=true&token=${token}`);
  }
);

// Validation helper functions
function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
}

function validatePhone(phone) {
  if (!phone) return true; // Phone is optional
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone);
}

function getPasswordRequirements() {
  return "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)";
}

function getPhoneRequirements() {
  return "Phone number must be exactly 10 digits (numbers only)";
}

router.get("/health", (req, res) => {
  res.json({ ok: true });
});

// GET /api/validation-rules - Get validation requirements
router.get("/validation-rules", (req, res) => {
  res.json({
    email: {
      pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      message: "Please provide a valid email address with a proper domain (e.g., example@domain.com)"
    },
    password: {
      pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
      message: getPasswordRequirements(),
      requirements: [
        "At least 8 characters long",
        "At least one uppercase letter (A-Z)",
        "At least one lowercase letter (a-z)",
        "At least one number (0-9)",
        "At least one special character (@$!%*?&)"
      ]
    },
    phone: {
      pattern: "^[0-9]{10}$",
      message: getPhoneRequirements(),
      requirements: [
        "Exactly 10 digits",
        "Numbers only (no spaces, dashes, or special characters)",
        "Phone number is optional"
      ]
    }
  });
});

// POST /api/validate - Test validation endpoint
router.post("/validate", (req, res) => {
  const { email, password } = req.body;

  const validation = {
    email: {
      value: email,
      isValid: email ? validateEmail(email) : false,
      message: email ? (validateEmail(email) ? "Valid email" : "Please provide a valid email address with a proper domain") : "Email is required"
    },
    password: {
      value: password ? "***hidden***" : "",
      isValid: password ? validatePassword(password) : false,
      message: password ? (validatePassword(password) ? "Valid password" : getPasswordRequirements()) : "Password is required"
    }
  };

  res.json({
    isValid: validation.email.isValid && validation.password.isValid,
    validation
  });
});

// POST /api/register
router.post("/register", authController.registerUser);

// POST /api/verify-email
router.post("/verify-email", authController.verifyEmail);

// POST /api/resend-otp
router.post("/resend-otp", authController.resendOTP);

// POST /api/login
router.post("/login", authController.loginUser);


function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// POST /api/otp/send
router.post("/otp/send", async (req, res) => {
  try {
    const { channel, email, phone } = req.body;
    if (!channel || !["email", "phone"].includes(channel)) {
      return res.status(400).json({ message: "Invalid channel" });
    }

    const query = channel === "email" ? { email } : { phone };
    if (!query.email && !query.phone) {
      return res.status(400).json({ message: `Missing ${channel}` });
    }

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: "User not found" });

    const code = generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (channel === "email") {
      user.emailOtp = code;
      user.emailOtpExpiresAt = expires;

      const emailSent = await emailService.sendOTP(user.email, code);
      if (!emailSent) {
        console.warn("Failed to send email OTP via emailService; logging instead");
        console.log(`Email OTP for ${user.email}: ${code}`);
      }
    } else {
      user.phoneOtp = code;
      user.phoneOtpExpiresAt = expires;

      // Try multiple SMS providers
      const smsClient = req.app.get("smsClient");
      const smsProvider = process.env.SMS_PROVIDER || 'console';

      try {
        if (smsProvider !== 'twilio' && smsProvider !== 'console') {
          // Use alternative SMS service (Fast2SMS, MSG91, etc.)
          await sendSMS(user.phone, `Your verification code is ${code}. It expires in 10 minutes.`, code);
          console.log(`✅ SMS sent via ${smsProvider} to ${user.phone}`);
        } else if (smsClient && process.env.TWILIO_FROM_NUMBER) {
          // Use Twilio
          await smsClient.messages.create({
            from: process.env.TWILIO_FROM_NUMBER,
            to: user.phone,
            body: `Your verification code is ${code}. It expires in 10 minutes.`,
          });
          console.log(`✅ SMS sent via Twilio to ${user.phone}`);
        } else {
          // Fallback to console
          console.log(`Phone OTP for ${user.phone}: ${code}`);
        }
      } catch (e) {
        console.warn("Failed to send SMS OTP; logging instead", e?.message);
        console.log(`Phone OTP for ${user.phone}: ${code}`);
      }
    }

    await user.save();
    res.json({ message: "OTP sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/otp/verify
router.post("/otp/verify", async (req, res) => {
  try {
    const { channel, email, phone, otp } = req.body;
    if (!channel || !["email", "phone"].includes(channel)) {
      return res.status(400).json({ message: "Invalid channel" });
    }
    if (!otp) return res.status(400).json({ message: "OTP is required" });

    const query = channel === "email" ? { email } : { phone };
    if (!query.email && !query.phone) {
      return res.status(400).json({ message: `Missing ${channel}` });
    }

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (channel === "email") {
      if (!user.emailOtp || !user.emailOtpExpiresAt) {
        return res.status(400).json({ message: "No OTP requested" });
      }
      if (new Date() > user.emailOtpExpiresAt) {
        return res.status(400).json({ message: "OTP expired" });
      }
      if (user.emailOtp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
      user.isEmailVerified = true;
      user.emailOtp = undefined;
      user.emailOtpExpiresAt = undefined;
    } else {
      if (!user.phoneOtp || !user.phoneOtpExpiresAt) {
        return res.status(400).json({ message: "No OTP requested" });
      }
      if (new Date() > user.phoneOtpExpiresAt) {
        return res.status(400).json({ message: "OTP expired" });
      }
      if (user.phoneOtp !== otp) {
        return res.status(400).json({ message: "Invalid OTP" });
      }
      user.isPhoneVerified = true;
      user.phoneOtp = undefined;
      user.phoneOtpExpiresAt = undefined;
    }

    await user.save();
    res.json({ message: "Verified successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/otp/resend
router.post("/otp/resend", async (req, res) => {
  try {
    const { channel, email, phone } = req.body;
    if (!channel || !["email", "phone"].includes(channel)) {
      return res.status(400).json({ message: "Invalid channel" });
    }

    const query = channel === "email" ? { email } : { phone };
    if (!query.email && !query.phone) {
      return res.status(400).json({ message: `Missing ${channel}` });
    }

    const user = await User.findOne(query);
    if (!user) return res.status(404).json({ message: "User not found" });

    const code = generateOtp();
    const expires = new Date(Date.now() + 10 * 60 * 1000);

    if (channel === "email") {
      user.emailOtp = code;
      user.emailOtpExpiresAt = expires;

      const emailSent = await emailService.sendOTP(user.email, code);
      if (!emailSent) {
        console.warn("Failed to resend email OTP via emailService; logging instead");
        console.log(`Resent Email OTP for ${user.email}: ${code}`);
      }
    } else {
      user.phoneOtp = code;
      user.phoneOtpExpiresAt = expires;
      const smsClient = req.app.get("smsClient");
      if (smsClient && process.env.TWILIO_FROM_NUMBER) {
        try {
          await smsClient.messages.create({
            from: process.env.TWILIO_FROM_NUMBER,
            to: user.phone,
            body: `Your verification code is ${code}. It expires in 10 minutes.`,
          });
        } catch (e) {
          console.warn("Failed to resend SMS OTP; logging instead", e?.message);
          console.log(`Resent Phone OTP for ${user.phone}: ${code}`);
        }
      } else {
        console.log(`Resent Phone OTP for ${user.phone}: ${code}`);
      }
    }

    await user.save();
    res.json({ message: "OTP resent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users (debug only)
router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "name email phone role isEmailVerified isPhoneVerified").lean();
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/users/:id
router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/user?email=
router.get("/user", async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();
    if (!email) return res.status(400).json({ message: "email is required" });
    const user = await User.findOne({ email }).lean();
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/:id - Update user
router.put("/users/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Remove sensitive fields that shouldn't be updated directly
    delete updates.password;
    delete updates._id;
    delete updates.emailOtp;
    delete updates.phoneOtp;
    delete updates.emailOtpExpiresAt;
    delete updates.phoneOtpExpiresAt;

    // Clean and validate email if provided
    if (updates.email) {
      updates.email = String(updates.email).trim().toLowerCase();
      // Check if email already exists for another user
      const existingUser = await User.findOne({
        email: updates.email,
        _id: { $ne: id }
      });
      if (existingUser) {
        return res.status(400).json({ message: "Email already exists" });
      }
    }

    // Clean other fields
    if (updates.name) updates.name = String(updates.name).trim();
    if (updates.phone) updates.phone = String(updates.phone).trim();

    const user = await User.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    ).select("-password -emailOtp -phoneOtp -emailOtpExpiresAt -phoneOtpExpiresAt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      user
    });
  } catch (err) {
    console.error(err);
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: "Validation error", details: err.message });
    }
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/users/:id/password - Update user password
router.put("/users/:id/password", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    // Validate new password strength
    if (!validatePassword(newPassword)) {
      return res.status(400).json({
        message: getPasswordRequirements()
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    user.password = hashedPassword;
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    console.error(err);

    // Handle validation errors
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({
        message: "Validation failed",
        errors: errors
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// DELETE /api/users/:id - Delete user
router.delete("/users/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/mentors - Get all mentors
router.get("/mentors", async (req, res) => {
  try {
    const mentors = await User.find(
      { role: "mentor" },
      "name email phone mentor profilePicture bio skills location company position isEmailVerified isPhoneVerified"
    ).lean();

    res.json({ mentors });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/students - Get all students  
router.get("/students", async (req, res) => {
  try {
    const students = await User.find(
      { role: "student" },
      "name email phone mentee profilePicture bio skills location isEmailVerified isPhoneVerified"
    ).lean();

    res.json({ students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/profile - Create or update user profile
router.post("/profile", authMiddleware, async (req, res) => {
  try {
    const { email, mentorExtras, menteeExtras, ...profileData } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Prepare update data
    const updateData = {
      name: profileData.name,
      phone: profileData.phone,
      location: profileData.location,
      bio: profileData.bio,
      profilePicture: profileData.profilePicture,
      skills: profileData.skills || [],
      languages: profileData.languages || [],
      certifications: profileData.certifications || [],
      education: profileData.education,
      company: profileData.company,
      position: profileData.position,
      availability: profileData.availability || [],
    };

    // Add role-specific nested data
    if (profileData.role === "mentor" && mentorExtras) {
      updateData.mentor = {
        domain: profileData.company || "",
        experience: profileData.experience || "",
        hourlyRate: profileData.hourlyRate || "",
        languages: Array.isArray(profileData.languages) ? profileData.languages.join(", ") : "",
        services: Array.isArray(mentorExtras.services) ? mentorExtras.services.join(", ") : "",
        availability: Array.isArray(profileData.availability) ? profileData.availability.join(", ") : "",

        // Additional mentor fields
        industries: Array.isArray(mentorExtras.industries) ? mentorExtras.industries : [],
        mentorshipFormats: Array.isArray(mentorExtras.formats) ? mentorExtras.formats : [],
        communicationStyle: mentorExtras.communicationStyle || "",
        timezone: mentorExtras.timezone || "",
        maxStudents: mentorExtras.maxStudents || 10,
        preferredStudentLevel: Array.isArray(mentorExtras.preferredStudentLevel) ? mentorExtras.preferredStudentLevel : [],

        // Keep existing metrics if they exist, otherwise set defaults
        totalSessions: mentorExtras.totalSessions || 0,
        activeStudents: mentorExtras.activeStudents || 0,
        averageRating: mentorExtras.averageRating || 0,
        totalReviews: mentorExtras.totalReviews || 0,
        isVerified: mentorExtras.isVerified || false
      };
    }

    if (profileData.role === "student" && menteeExtras) {
      updateData.mentee = {
        targetRole: menteeExtras.targetRole || "",
        currentLevel: menteeExtras.currentLevel || "",
        interests: Array.isArray(menteeExtras.interests) ? menteeExtras.interests.join(", ") : "",
        goals: Array.isArray(menteeExtras.goals) ? menteeExtras.goals.join(", ") : "",

        // Additional student fields
        learningStyle: menteeExtras.learningStyle || "",
        portfolioLinks: Array.isArray(menteeExtras.portfolioLinks) ? menteeExtras.portfolioLinks : [],
        preferredCommunicationStyle: menteeExtras.preferredCommunicationStyle || "",
        timezone: menteeExtras.timezone || "",
        preferredMentorTypes: Array.isArray(menteeExtras.preferredMentorTypes) ? menteeExtras.preferredMentorTypes : [],

        // Keep existing metrics if they exist, otherwise set defaults
        completedSessions: menteeExtras.completedSessions || 0,
        activeMentors: menteeExtras.activeMentors || 0,
        hoursLearned: menteeExtras.hoursLearned || 0,
        averageRating: menteeExtras.averageRating || 0
      };
    }

    // Update last login
    updateData.lastLogin = new Date();

    // Find user by email and update profile
    const user = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      updateData,
      { new: true, runValidators: true }
    ).select("-password -emailOtp -phoneOtp -emailOtpExpiresAt -phoneOtpExpiresAt");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ message: "Server error", details: err.message });
  }
});

// GET /api/profile/:email - Get user profile by email
router.get("/profile/:email", async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();

    const user = await User.findOne({ email }).select("-password -emailOtp -phoneOtp -emailOtpExpiresAt -phoneOtpExpiresAt").lean();

    if (!user) {
      return res.status(404).json({ message: "User profile not found" });
    }

    // Format the response to match frontend expectations
    const profileData = {
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.role || "student",
      location: user.location || "",
      bio: user.bio || "",
      profilePicture: user.profilePicture || "",
      skills: user.skills || [],
      languages: user.languages || [],
      availability: user.availability || [],
      certifications: user.certifications || [],
      education: user.education || "",
      company: user.company || "",
      position: user.position || "",
      isActive: user.isActive,
      lastLogin: user.lastLogin,

      // Include mentor/mentee specific data
      mentor: user.mentor || null,
      mentee: user.mentee || null,

      // Legacy fields for backward compatibility
      experience: user.mentor?.experience || "",
      hourlyRate: user.mentor?.hourlyRate || ""
    };

    res.json({ user: profileData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/mentors - Get all mentors
router.get("/mentors", async (req, res) => {
  try {
    const { page = 1, limit = 10, domain, skills, experience, minRating } = req.query;

    // Build query filters
    const filters = {
      role: "mentor",
      isActive: true,
      "mentor.isVerified": true
    };

    if (domain) filters.company = new RegExp(domain, 'i');
    if (skills) filters.skills = { $in: skills.split(",") };
    if (experience) filters["mentor.experience"] = experience;
    if (minRating) filters["mentor.averageRating"] = { $gte: parseFloat(minRating) };

    const mentors = await User.find(filters)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ "mentor.averageRating": -1, "mentor.totalSessions": -1 })
      .select("-password -emailOtp -phoneOtp -emailOtpExpiresAt -phoneOtpExpiresAt -mentee");

    const total = await User.countDocuments(filters);

    res.json({
      mentors,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/students - Get all students  
router.get("/students", async (req, res) => {
  try {
    const { page = 1, limit = 10, skills, interests, currentLevel } = req.query;

    // Build query filters
    const filters = {
      role: "student",
      isActive: true
    };

    if (skills) filters.skills = { $in: skills.split(",") };
    if (interests) filters["mentee.interests"] = new RegExp(interests, 'i');
    if (currentLevel) filters["mentee.currentLevel"] = currentLevel;

    const students = await User.find(filters)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .sort({ createdAt: -1 })
      .select("-password -emailOtp -phoneOtp -emailOtpExpiresAt -phoneOtpExpiresAt -mentor");

    const total = await User.countDocuments(filters);

    res.json({
      students,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/mentor/:id/stats - Update mentor statistics
router.put("/mentor/:id/stats", authMiddleware, async (req, res) => {
  try {
    const { totalSessions, activeStudents, averageRating, totalReviews } = req.body;

    const updateData = {};
    if (totalSessions !== undefined) updateData["mentor.totalSessions"] = totalSessions;
    if (activeStudents !== undefined) updateData["mentor.activeStudents"] = activeStudents;
    if (averageRating !== undefined) updateData["mentor.averageRating"] = averageRating;
    if (totalReviews !== undefined) updateData["mentor.totalReviews"] = totalReviews;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password -emailOtp -phoneOtp -emailOtpExpiresAt -phoneOtpExpiresAt");

    if (!user || user.role !== "mentor") {
      return res.status(404).json({ message: "Mentor not found" });
    }

    res.json({
      message: "Mentor statistics updated successfully",
      mentor: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// PUT /api/student/:id/stats - Update student statistics
router.put("/student/:id/stats", authMiddleware, async (req, res) => {
  try {
    const { completedSessions, activeMentors, hoursLearned, averageRating } = req.body;

    const updateData = {};
    if (completedSessions !== undefined) updateData["mentee.completedSessions"] = completedSessions;
    if (activeMentors !== undefined) updateData["mentee.activeMentors"] = activeMentors;
    if (hoursLearned !== undefined) updateData["mentee.hoursLearned"] = hoursLearned;
    if (averageRating !== undefined) updateData["mentee.averageRating"] = averageRating;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password -emailOtp -phoneOtp -emailOtpExpiresAt -phoneOtpExpiresAt");

    if (!user || user.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    res.json({
      message: "Student statistics updated successfully",
      student: user
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST /api/session-complete - Mark session as completed (updates both mentor and student)
router.post("/session-complete", async (req, res) => {
  try {
    const { mentorId, studentId, hoursSpent = 1, mentorRating, studentRating } = req.body;

    if (!mentorId || !studentId) {
      return res.status(400).json({ message: "Both mentorId and studentId are required" });
    }

    // Update mentor statistics
    const mentor = await User.findById(mentorId);
    if (mentor && mentor.role === "mentor") {
      const newMentorStats = {
        "mentor.totalSessions": (mentor.mentor.totalSessions || 0) + 1,
        "mentor.totalReviews": mentorRating ? (mentor.mentor.totalReviews || 0) + 1 : (mentor.mentor.totalReviews || 0)
      };

      if (mentorRating) {
        const currentAvg = mentor.mentor.averageRating || 0;
        const currentReviews = mentor.mentor.totalReviews || 0;
        newMentorStats["mentor.averageRating"] = ((currentAvg * currentReviews) + mentorRating) / (currentReviews + 1);
      }

      await User.findByIdAndUpdate(mentorId, newMentorStats);
    }

    // Update student statistics
    const student = await User.findById(studentId);
    if (student && student.role === "student") {
      const newStudentStats = {
        "mentee.completedSessions": (student.mentee.completedSessions || 0) + 1,
        "mentee.hoursLearned": (student.mentee.hoursLearned || 0) + hoursSpent
      };

      if (studentRating) {
        const currentAvg = student.mentee.averageRating || 0;
        const currentSessions = student.mentee.completedSessions || 0;
        newStudentStats["mentee.averageRating"] = ((currentAvg * currentSessions) + studentRating) / (currentSessions + 1);
      }

      await User.findByIdAndUpdate(studentId, newStudentStats);
    }

    res.json({
      message: "Session completed successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// Upload profile picture
router.post("/profile/upload-picture", profilePictureUpload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { email } = req.body;
    if (!email) {
      // Delete uploaded file if email is missing
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Email is required" });
    }

    // Find user and update profile picture
    const user = await User.findOne({ email });
    if (!user) {
      // Delete uploaded file if user not found
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
      const oldPicturePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldPicturePath)) {
        fs.unlinkSync(oldPicturePath);
      }
    }

    // Update user with new profile picture path
    const profilePicturePath = `/uploads/profiles/${req.file.filename}`;
    user.profilePicture = profilePicturePath;
    await user.save();

    res.json({
      message: "Profile picture uploaded successfully",
      profilePicture: profilePicturePath,
      url: `${req.protocol}://${req.get('host')}${profilePicturePath}`
    });
  } catch (error) {
    // Delete uploaded file if there's an error
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    console.error("Error uploading profile picture:", error);
    res.status(500).json({
      message: "Failed to upload profile picture",
      error: error.message
    });
  }
});

// Delete profile picture
router.delete("/profile/delete-picture", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.profilePicture) {
      return res.status(400).json({ message: "No profile picture to delete" });
    }

    // Delete file from disk
    const picturePath = path.join(__dirname, '..', user.profilePicture);
    if (fs.existsSync(picturePath)) {
      fs.unlinkSync(picturePath);
    }

    // Remove from database
    user.profilePicture = null;
    await user.save();

    res.json({ message: "Profile picture deleted successfully" });
  } catch (error) {
    console.error("Error deleting profile picture:", error);
    res.status(500).json({
      message: "Failed to delete profile picture",
      error: error.message
    });
  }
});

module.exports = router;
