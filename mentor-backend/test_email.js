require('dotenv').config();
const nodemailer = require('nodemailer');

async function test() {
    console.log("Testing SMTP Connection...");
    console.log(`Host: ${process.env.SMTP_HOST}`);
    console.log(`Port: ${process.env.SMTP_PORT}`);
    console.log(`Secure: ${process.env.SMTP_SECURE}`);
    console.log(`User: ${process.env.SMTP_USER}`);

    try {
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure: Boolean(process.env.SMTP_SECURE === "true"),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            },
        });
        await transporter.verify();
        console.log("✅ Verification success: Server is ready to take our messages");
    } catch (err) {
        console.error("❌ Verification failed:", err);
    }
}
test();
