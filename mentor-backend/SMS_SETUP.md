# SMS/Phone OTP Configuration Guide

## Quick Setup with Twilio

Your `.env` file has been updated with SMS configuration. Follow these steps to enable phone OTP:

## Option 1: Twilio (Recommended - Most Reliable)

### Step 1: Sign Up
1. Go to: https://www.twilio.com/try-twilio
2. Sign up for a free account (you'll get $15 credit)
3. Verify your email and phone number

### Step 2: Get Your Credentials
1. Go to: https://console.twilio.com/
2. Copy these values from the dashboard:
   - **Account SID** (starts with "AC")
   - **Auth Token** (click to reveal)

### Step 3: Get a Phone Number
1. In Twilio Console, go to: **Phone Numbers** → **Manage** → **Buy a number**
2. Or use your trial number for testing
3. Copy the phone number (format: +1234567890)

### Step 4: Update `.env` File
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # Your Account SID
TWILIO_AUTH_TOKEN=your-32-character-auth-token          # Your Auth Token
TWILIO_FROM_NUMBER=+1234567890                          # Your Twilio phone number
```

### Step 5: Restart Backend
```bash
cd mentor-backend
node index.js
```

You should see:
```
📱 Twilio SMS client configured
```

## Option 2: MSG91 (Best for India)

1. Sign up at: https://msg91.com/
2. Get your Auth Key from dashboard
3. Get a sender ID or phone number
4. **Note:** You'll need to modify the code to use MSG91's API instead of Twilio

## Option 3: Vonage (formerly Nexmo)

1. Sign up at: https://dashboard.nexmo.com/sign-up
2. Get API Key and API Secret
3. Get a virtual number
4. **Note:** You'll need to modify the code to use Vonage's API

## Testing (Free Trial Limitations)

**Twilio Trial Account:**
- ✅ Can send SMS to verified numbers only
- ✅ SMS will have "Sent from a Twilio trial account" message
- ❌ Cannot send to random numbers until you upgrade
- 💰 Free $15 credit

**To Add Verified Numbers (Trial):**
1. Go to: https://console.twilio.com/us1/develop/phone-numbers/manage/verified
2. Click "Add a new Caller ID"
3. Enter the phone number you want to test
4. Verify with the code sent to that number

## How It Works

When a user verifies their phone:
1. User enters their phone number (e.g., +919876543210)
2. System generates a 6-digit OTP
3. Twilio sends SMS to **THEIR phone number** with the OTP
4. User enters the OTP to verify

## Format Requirements

**Phone Number Format:** Must be in E.164 format
- ✅ Correct: `+919876543210` (India)
- ✅ Correct: `+14155552671` (USA)
- ❌ Wrong: `9876543210`
- ❌ Wrong: `+91 98765 43210`

## Troubleshooting

### "Invalid SID" error
- Make sure your Account SID starts with "AC"
- Copy the full 34-character SID

### "Invalid Auth Token" error
- Auth Token is case-sensitive
- Make sure you copied the entire token (32 characters)

### "Invalid phone number" error
- Use E.164 format: +[country code][number]
- No spaces or special characters except the leading +

### SMS not received
- Check if the recipient number is verified (for trial accounts)
- Check your Twilio logs: https://console.twilio.com/us1/monitor/logs/sms
- Ensure you have sufficient balance

### "Twilio client not configured" message
- Check that all three variables are set in `.env`
- Restart your backend server after updating `.env`

## Cost Estimation

**Twilio Pricing (as of 2024):**
- SMS (USA): ~$0.0079 per message
- SMS (India): ~$0.0070 per message
- SMS (Most countries): ~$0.01 - $0.05 per message

**Free Trial:**
- $15 credit = ~2,000 SMS messages
- Perfect for development and testing

## Production Tips

1. **Upgrade from Trial:** Remove trial limitations
2. **Use Messaging Service:** Better delivery rates
3. **Enable Delivery Reports:** Track SMS status
4. **Set Up Webhooks:** Get real-time delivery status
5. **Consider Alternatives:** MSG91 is cheaper for India

## Current Implementation

Your backend is configured to:
- ✅ Send OTP via SMS when user verifies phone
- ✅ Fall back to console logging if Twilio not configured
- ✅ Validate phone numbers in E.164 format
- ✅ Use environment variables for security

Replace the placeholder values in `.env` with your actual Twilio credentials and restart the server!
