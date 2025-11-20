// 1 
const User = require("../models/User");
const bcrypt = require("bcryptjs");
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

// 5
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
// 6 

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role,
      mentor,
      mentee,
    });
// 7
    await user.save();
// 8
    res.status(201).json({ message: "User registered successfully" });
  } 
  // 9
  catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
