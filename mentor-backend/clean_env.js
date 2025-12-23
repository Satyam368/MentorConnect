const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
const content = fs.readFileSync(envPath).toString();

console.log("Cleaning .env...");

let envMap = new Map();
let keysOrder = [];

// Split by newlines
const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/);

lines.forEach(line => {
    line = line.trim();
    if (!line || line.startsWith('#')) return;

    // Check for comments invalidly placed like VAR=VAL # comment (dotenv support varies, better safe)
    // Actually simplicity: split by first =
    const idx = line.indexOf('=');
    if (idx !== -1) {
        const key = line.substring(0, idx).trim();
        let val = line.substring(idx + 1).trim();

        // Remove 'callbacks.googleusercontent.com' if it was appended to Twilio line accidentally
        if (key === 'TWILIO_ACCOUNT_SID' && val.includes('callbacks.googleusercontent.com')) {
            val = val.split(/\s+/)[0];
        }

        if (!envMap.has(key)) {
            keysOrder.push(key);
        }
        envMap.set(key, val);
    }
});

// Force secure secret if default or weak
let secret = envMap.get('JWT_SECRET');
if (!secret || secret.includes('please_change_this')) {
    envMap.set('JWT_SECRET', 'mentor_connect_safe_secret_key_' + Date.now());
    if (!keysOrder.includes('JWT_SECRET')) keysOrder.push('JWT_SECRET');
}

let newContent = "";
keysOrder.forEach(key => {
    newContent += `${key}=${envMap.get(key)}\n`;
});

fs.writeFileSync(envPath, newContent, 'utf8');
console.log("Aggressive cleanup done.");
