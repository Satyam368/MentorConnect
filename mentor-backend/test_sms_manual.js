require('dotenv').config();
const twilio = require('twilio');

async function test() {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_NUMBER;
    const to = '+919350747064'; // User's number

    console.log(`Sending from ${from} to ${to}...`);
    console.log(`SID: ${sid ? sid.substring(0, 6) + '...' : 'MISSING'}`);

    try {
        const client = twilio(sid, token);
        const msg = await client.messages.create({
            body: 'Test SMS from Mentor Connect - Verification',
            from: from,
            to: to
        });
        console.log('✅ Success! Message SID:', msg.sid);
    } catch (err) {
        console.error('❌ Twilio Error:', err.message);
        if (err.code === 20003) {
            console.log('Hint: Check Account SID and Auth Token');
        }
        if (err.code === 21608) {
            console.log('Hint: Verified Caller ID issue (Trial account)');
        }
    }
}

test();
