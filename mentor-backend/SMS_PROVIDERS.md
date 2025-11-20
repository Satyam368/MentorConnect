# Alternative SMS Providers - Quick Setup

## ✅ RECOMMENDED: Fast2SMS (India - FREE)

**Best for:** Testing and small projects in India

### Setup Steps:
1. **Sign up:** https://www.fast2sms.com/
2. **Verify your number** (free)
3. **Get API Key** from dashboard
4. **Update `.env`:**
   ```env
   SMS_PROVIDER=fast2sms
   FAST2SMS_API_KEY=your-api-key-here
   ```
5. **Restart server:** `node index.js`

**FREE Tier:** 50 SMS/day  
**Paid:** Starting from ₹100 for 1000 SMS  
**Numbers:** Indian numbers only (+91)

---

## MSG91 (India - Best Pricing)

**Best for:** Production apps in India

### Setup Steps:
1. **Sign up:** https://msg91.com/
2. **Get credits** (starts ₹100)
3. **Create OTP template** in dashboard
4. **Get Auth Key and Flow ID**
5. **Update `.env`:**
   ```env
   SMS_PROVIDER=msg91
   MSG91_AUTH_KEY=your-auth-key-here
   MSG91_FLOW_ID=your-flow-id
   MSG91_SENDER_ID=MSGIND
   ```

**Pricing:** ₹0.15 per SMS  
**Numbers:** Supports international

---

## 2Factor.in (India - OTP Specialized)

**Best for:** OTP-only use cases

### Setup Steps:
1. **Sign up:** https://2factor.in/
2. **Get API Key**
3. **Update `.env`:**
   ```env
   SMS_PROVIDER=2factor
   TWOFACTOR_API_KEY=your-api-key-here
   ```

**Pricing:** ₹0.10-0.20 per OTP  
**Numbers:** Indian numbers

---

## Textlocal (India)

### Setup Steps:
1. **Sign up:** https://www.textlocal.in/
2. **Get API Key and Sender ID**
3. **Update `.env`:**
   ```env
   SMS_PROVIDER=textlocal
   TEXTLOCAL_API_KEY=your-api-key-here
   TEXTLOCAL_SENDER=TXTLCL
   ```

**Pricing:** ₹0.15-0.25 per SMS

---

## Comparison Table

| Provider     | Free Tier | Cost/SMS | Best For        | Countries |
|-------------|-----------|----------|-----------------|-----------|
| Fast2SMS    | 50/day    | ₹0.10    | Testing         | India     |
| MSG91       | No        | ₹0.15    | Production      | Global    |
| 2Factor     | No        | ₹0.15    | OTP only        | India     |
| Textlocal   | No        | ₹0.20    | Marketing       | India     |
| Twilio      | $15       | $0.0079  | International   | Global    |

---

## How to Switch Providers

Just change `SMS_PROVIDER` in `.env`:

```env
# For Fast2SMS (Free)
SMS_PROVIDER=fast2sms
FAST2SMS_API_KEY=your-key

# For MSG91 (Production)
SMS_PROVIDER=msg91
MSG91_AUTH_KEY=your-key
MSG91_FLOW_ID=your-flow-id

# For console logging (Testing)
SMS_PROVIDER=console
```

Restart the server and you're done!

---

## Testing Without SMS (Current Setup)

Your current configuration:
```env
SMS_PROVIDER=console
```

This will:
- ✅ NOT send actual SMS
- ✅ Print OTP in console
- ✅ Perfect for development
- ✅ No cost, no setup needed

**Console Output:**
```
📱 Sending SMS via console to +919876543210
📱 Console SMS to +919876543210: Your verification code is 123456
```

---

## Production Recommendation

1. **Start with Fast2SMS** for testing (50 free SMS/day)
2. **Switch to MSG91** when going live (₹0.15 per SMS)
3. **Use Twilio** if you need international SMS

---

## Current Implementation

The system automatically:
- ✅ Sends OTP to USER'S phone number (not yours!)
- ✅ Falls back to console if provider fails
- ✅ Supports multiple providers
- ✅ Easy to switch between providers
- ✅ Handles Indian phone numbers (+91)

Just uncomment the provider you want in `.env` and add credentials!
