require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/mentor";
const API_URL = "http://localhost:5000/api";

async function testFlow() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URI);
        console.log("Connected.");

        const email = "testverify@example.com";

        // 1. Cleanup
        console.log(`Cleaning up user ${email}...`);
        await User.deleteMany({ email });

        // 2. Register
        console.log("Registering new user...");
        const regRes = await axios.post(`${API_URL}/register`, {
            name: "Test User",
            email: email,
            password: "Password123!",
            role: "student"
        });
        console.log("Registration Response:", regRes.data);

        if (regRes.data.emailSent) {
            console.log("✅ API claims email was sent.");
        } else {
            console.warn("⚠️ API says email was NOT sent (check console logs of server).");
        }

        // 3. Get OTP from DB
        console.log("Fetching OTP from database...");
        const user = await User.findOne({ email });
        if (!user) {
            throw new Error("User not found in DB!");
        }
        const otp = user.emailOtp;
        console.log(`Found OTP: ${otp}`);

        if (!otp) {
            throw new Error("No OTP generated for user!");
        }

        // 4. Verify Email
        console.log("Verifying email with OTP...");
        try {
            const verifyRes = await axios.post(`${API_URL}/verify-email`, {
                email: email,
                otp: otp
            });
            console.log("Verification Response:", verifyRes.data);
        } catch (e) {
            console.error("Verification failed:", e.response ? e.response.data : e.message);
        }

        // 5. Check status
        const verifiedUser = await User.findOne({ email });
        console.log(`Final User State - isEmailVerified: ${verifiedUser.isEmailVerified}`);

        if (verifiedUser.isEmailVerified) {
            console.log("✅ SUCCESS: User is verified.");
        } else {
            console.error("❌ FAILURE: User is NOT verified.");
        }

    } catch (err) {
        console.error("Test Error:", err.message);
        if (err.response) {
            console.error("API Error Response:", err.response.data);
        }
    } finally {
        await mongoose.disconnect();
    }
}

testFlow();
