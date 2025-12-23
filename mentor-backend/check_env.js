require('dotenv').config();

console.log("Checking Environment Variables...");

const emailVars = [
    'SMTP_HOST',
    'SMTP_PORT',
    'SMTP_SECURE',
    'SMTP_USER',
    'SMTP_PASS',
    'SMTP_FROM'
];

const smsVars = [
    'SMS_PROVIDER',
    'TWILIO_ACCOUNT_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_FROM_NUMBER',
    'FAST2SMS_API_KEY',
    'MSG91_AUTH_KEY'
];

console.log("\n--- Email Configuration ---");
emailVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        // Mask the value for security in logs, show first 2 chars
        const masked = value.length > 4 ? value.substring(0, 2) + '*'.repeat(value.length - 2) : '****';
        console.log(`${varName}: SET (${masked})`);
    } else {
        console.log(`${varName}: MISSING`);
    }
});

console.log("\n--- SMS Configuration ---");
smsVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
        const masked = value.length > 4 ? value.substring(0, 2) + '*'.repeat(value.length - 2) : '****';
        console.log(`${varName}: SET (${masked})`);
    } else {
        console.log(`${varName}: MISSING`);
    }
});
