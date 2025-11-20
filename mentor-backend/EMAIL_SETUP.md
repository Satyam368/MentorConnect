# Email Configuration Guide

## Quick Setup

Your `.env` file has been updated with SMTP configuration. Follow these steps to enable email sending:

## Option 1: Gmail (Recommended for Testing)

1. **Enable 2-Factor Authentication** on your Gmail account:
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "MentorConnect" as the name
   - Click "Generate"
   - Copy the 16-character password

3. **Update `.env` file**:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx  # Your 16-character app password
   SMTP_FROM=MentorConnect <your-email@gmail.com>
   ```

4. **Restart your backend server**:
   ```bash
   cd mentor-backend
   node index.js
   ```

## Option 2: Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
SMTP_FROM=MentorConnect <your-email@outlook.com>
```

## Option 3: SendGrid (For Production)

1. Sign up at: https://sendgrid.com/
2. Create an API Key
3. Update `.env`:
   ```env
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=apikey
   SMTP_PASS=your-sendgrid-api-key
   SMTP_FROM=MentorConnect <noreply@yourdomain.com>
   ```

## Option 4: Mailtrap (For Testing Only)

1. Sign up at: https://mailtrap.io/
2. Get credentials from inbox settings
3. Update `.env`:
   ```env
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-mailtrap-username
   SMTP_PASS=your-mailtrap-password
   SMTP_FROM=MentorConnect <test@example.com>
   ```

## Verification

When you restart the server, you should see:
```
📧 Email transporter configured
```

If you see this instead, check your credentials:
```
📧 Email transporter not configured; OTPs will be logged to console
```

## Test Email Sending

1. Register a new user or request OTP
2. Check your email inbox for the verification code
3. If email doesn't arrive:
   - Check spam/junk folder
   - Verify SMTP credentials in `.env`
   - Check server console for error messages

## Troubleshooting

### "Invalid login" error
- Gmail: Make sure you're using App Password, not regular password
- Enable "Less secure app access" (not recommended for Gmail, use App Password instead)

### "Connection timeout"
- Check your firewall settings
- Try port 465 with `SMTP_SECURE=true`
- Check if your ISP blocks SMTP ports

### Emails go to spam
- Add proper `SMTP_FROM` with your domain
- Consider using a professional email service like SendGrid

## Current Configuration

Your backend is configured to:
- ✅ Send OTP via email when user registers/verifies
- ✅ Fall back to console logging if SMTP not configured
- ✅ Use environment variables for security

Replace the placeholder values in `.env` with your actual credentials and restart the server!
