const nodemailer = require('nodemailer');

const createTransporter = (port, secure) => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: port,
        secure: secure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

const sendOTP = async (email, otp) => {
    const mailOptions = {
        from: process.env.SMTP_FROM || process.env.SMTP_USER, // Ensure From is set
        to: email, // list of receivers
        subject: 'Your Verification Code', // Subject line
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <h1 style="color: #4F46E5; letter-spacing: 5px;">${otp}</h1>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `,
    };

    // 1. Try Default Configuration
    try {
        const port = Number(process.env.SMTP_PORT) || 587;
        const secure = process.env.SMTP_SECURE === 'true';

        const transporter = createTransporter(port, secure);
        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully on port %s: %s', port, info.messageId);
        return true;
    } catch (error) {
        console.warn(`⚠️ Failed to send email on default port: ${error.message}`);

        // 2. Retry with Fallback (Port 465 SSL for Gmail/others) if the error suggests network/port issues
        // ETIMEDOUT, ESOCKET, or generic connection errors.
        if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKET' || error.code === 'ECONNREFUSED') {
            console.log('🔄 Retrying on port 465 (SSL)...');
            try {
                const transporter465 = createTransporter(465, true);
                const info465 = await transporter465.sendMail(mailOptions);
                console.log('✅ Email sent successfully on port 465: %s', info465.messageId);
                return true;
            } catch (retryError) {
                console.error('❌ Retry on port 465 failed:', retryError.message);
                // If auth failed here, it's definitely an auth issue
                if (retryError.responseCode === 535) {
                    console.error("💡 HINT: Check your App Password.");
                }
            }
        } else if (error.responseCode === 535) {
            console.error("❌ Authentication Failed. Please check your SMTP_USER and SMTP_PASS.");
            console.error("💡 If using Gmail, make sure you are using an APP PASSWORD.");
        }

        return false;
    }
};

module.exports = {
    sendOTP,
};
