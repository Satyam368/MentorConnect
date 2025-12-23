const User = require("../models/User");
const bcrypt = require("bcryptjs");
const emailService = require("../utils/emailService");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// 2
exports.registerUser = async (req, res) => {
  try {
    // 3
    const { name, email, password, role, mentor, mentee } = req.body;
    // 4
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      mentor,
      mentee,
      emailOtp: otp,
      emailOtpExpiresAt: otpExpires,
      isEmailVerified: false
    });

    await user.save();

    // Send OTP via email
    const emailSent = await emailService.sendOTP(email, otp);

    if (!emailSent) {
      // If email fails, we might still want to register them but warn, or fail completely.
      // For now, let's just log it.
      console.error("Failed to send OTP email to " + email);
    }

    res.status(201).json({
      message: "User registered successfully. Please check your email for verification code.",
      userId: user._id,
      emailSent,
      token: generateToken(user._id)
    });
  }
  // 9
  catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    if (user.emailOtp !== otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (user.emailOtpExpiresAt < Date.now()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    user.isEmailVerified = true;
    user.emailOtp = undefined;
    user.emailOtpExpiresAt = undefined;
    await user.save();

    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailOtp = otp;
    user.emailOtpExpiresAt = otpExpires;
    await user.save();

    const emailSent = await emailService.sendOTP(email, otp);

    if (!emailSent) {
      return res.status(500).json({ message: "Failed to send OTP email" });
    }

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (err) {
    console.error("Resend OTP error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.loginUser = async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    email = String(email).trim().toLowerCase();
    password = String(password).trim();


    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(password, user.password);
    } catch (_) {
      isMatch = false;
    }

    // Auto-fix legacy plain text passwords (optional feature from original code)
    if (!isMatch && user.password === password) {
      isMatch = true;
      try {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      } catch (_) { }
    }

    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });


    if (!user.isEmailVerified && !user.isPhoneVerified) {
      return res.status(403).json({ message: "Please verify your email or phone before logging in" });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture || "",
      },
      token: generateToken(user._id)
    });
  } catch (err) {
    console.error("Login Error Stack:", err);
    console.error("JWT_SECRET defined:", !!process.env.JWT_SECRET);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
