require('dotenv').config();
const nodemailer = require('nodemailer');

async function verifyCredentials() {
    console.log("---------------------------------------------------");
    console.log("🔍 Verifying SMTP Credentials...");
    console.log(`📌 User: ${process.env.SMTP_USER || 'Not Set'}`);
    console.log("---------------------------------------------------");

    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: 465, // Force SSL to eliminate port issues for now
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    try {
        await transporter.verify();
        console.log("\n✅ SUCCESS: Credentials are valid! Server is ready to send.");
        console.log("If you still don't receive emails, check your SPAM folder.");
    } catch (error) {
        console.log("\n❌ FAILURE: Could not log in to Gmail.");
        console.log("---------------------------------------------------");
        console.log("Error Code:", error.responseCode || error.code);
        console.log("Response:", error.response);

        if (error.responseCode === 535) {
            console.log("\n💡 DIAGNOSIS: '535 Authentication Failed'");
            console.log("---------------------------------------------------");
            console.log("This means your Password is WRONG.");
            console.log("1. You CANNOT use your regular Gmail password.");
            console.log("2. You MUST usage an 'App Password'.");
            console.log("   -> Go to: Google Account > Security > 2-Step Verification > App Passwords");
            console.log("   -> Generate a new one and paste it into your .env file.");
        }
    }
}

verifyCredentials();
