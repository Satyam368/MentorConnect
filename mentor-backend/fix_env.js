const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

try {
    let content = fs.readFileSync(envPath, 'utf8');

    // Check if JWT_SECRET exists
    if (!content.includes('JWT_SECRET=')) {
        console.log("JWT_SECRET missing. Appending...");

        // Ensure content ends with newline
        if (!content.endsWith('\n') && !content.endsWith('\r\n')) {
            content += '\n';
        }

        content += 'JWT_SECRET=mentor_connect_secret_key_2025\n';
        fs.writeFileSync(envPath, content);
        console.log("Appended JWT_SECRET.");
    } else {
        console.log("JWT_SECRET already exists.");
        // print the line to see if it's malformed
        const match = content.match(/.*JWT_SECRET.*/);
        console.log("Existing line:", match ? match[0] : "Found but failed regex info");
    }
} catch (error) {
    console.error("Error fixing .env:", error);
}
