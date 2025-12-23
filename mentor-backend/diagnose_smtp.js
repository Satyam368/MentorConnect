require('dotenv').config();
const net = require('net');
const nodemailer = require('nodemailer');

async function checkPort(host, port) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(3000); // 3 second timeout

        socket.on('connect', () => {
            console.log(`✅ TCP Connection to ${host}:${port} SUCCESS`);
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            console.log(`❌ TCP Connection to ${host}:${port} TIMED OUT`);
            socket.destroy();
            resolve(false);
        });

        socket.on('error', (err) => {
            console.log(`❌ TCP Connection to ${host}:${port} FAILED: ${err.message}`);
            resolve(false);
        });

        socket.connect(port, host);
    });
}

async function testNodemailer(port, secure) {
    console.log(`\nTesting Nodemailer with Port: ${port}, Secure: ${secure}...`);
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: port,
        secure: secure,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        connectionTimeout: 5000 // 5 seconds
    });

    try {
        await transporter.verify();
        console.log("✅ Nodemailer Verification SUCCESS");
        return true;
    } catch (err) {
        console.log(`❌ Nodemailer Verification FAILED: ${err.message}`);
        return false;
    }
}

async function runDiagnostics() {
    const host = process.env.SMTP_HOST || 'smtp.gmail.com';
    console.log(`Diagnostics for SMTP Host: ${host}`);
    console.log("----------------------------------------");

    // 1. Check TCP Connectivity
    console.log("\n1. Checking TCP Connectivity:");
    const port587 = await checkPort(host, 587);
    const port465 = await checkPort(host, 465); // Standard SSL
    const port2525 = await checkPort(host, 2525); // Alternative

    // 2. Try Nodemailer configurations based on connectivity
    console.log("\n2. Testing Mailer Configurations:");

    if (port587) {
        await testNodemailer(587, false);
    }

    if (port465) {
        await testNodemailer(465, true);
    }

    if (!port587 && !port465) {
        console.log("\n⚠️  CRITICAL: Cannot connect to SMTP server on standard ports.");
        console.log("    - Check your internet connection.");
        console.log("    - Check if a firewall or antivirus is blocking sending emails.");
        console.log("    - Try using a different network (e.g., mobile hotspot) if possible.");
    }
}

runDiagnostics();
