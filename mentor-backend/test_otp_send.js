const axios = require('axios');

const API_URL = "http://localhost:5000/api";
const email = "testverify@example.com";

async function testOtpSend() {
    try {
        console.log(`Testing OTP Send to ${email}...`);

        const res = await axios.post(`${API_URL}/otp/send`, {
            channel: "email",
            email: email
        });

        console.log("✅ Response:", res.data);
    } catch (err) {
        console.error("❌ Error:", err.message);
        if (err.response) {
            console.error("Response Data:", err.response.data);
        }
    }
}

testOtpSend();
