// SMS Service - Support for multiple providers
const axios = require('axios');

/**
 * Send SMS using Fast2SMS (India - Free tier available)
 * Sign up: https://www.fast2sms.com/
 */
async function sendFast2SMS(phone, message) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  
  if (!apiKey) {
    throw new Error('FAST2SMS_API_KEY not configured');
  }

  // Remove + and country code if present, Fast2SMS needs 10-digit number
  const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '');
  
  const url = 'https://www.fast2sms.com/dev/bulkV2';
  const params = {
    authorization: apiKey,
    message: message,
    language: 'english',
    route: 'q', // 'q' for quick/promotional, 'otp' for OTP route
    numbers: cleanPhone,
  };

  try {
    const response = await axios.get(url, { params });
    return response.data;
  } catch (error) {
    throw new Error(`Fast2SMS error: ${error.message}`);
  }
}

/**
 * Send SMS using MSG91 (India - Very affordable)
 * Sign up: https://msg91.com/
 */
async function sendMSG91(phone, message) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const senderId = process.env.MSG91_SENDER_ID || 'MSGIND';
  
  if (!authKey) {
    throw new Error('MSG91_AUTH_KEY not configured');
  }

  const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '');
  
  const url = 'https://api.msg91.com/api/v5/flow/';
  const data = {
    flow_id: process.env.MSG91_FLOW_ID,
    sender: senderId,
    mobiles: '91' + cleanPhone,
    VAR1: message, // Variable in your MSG91 template
  };

  try {
    const response = await axios.post(url, data, {
      headers: {
        'authkey': authKey,
        'content-type': 'application/json'
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(`MSG91 error: ${error.message}`);
  }
}

/**
 * Send SMS using 2Factor.in (India - OTP focused)
 * Sign up: https://2factor.in/
 */
async function send2Factor(phone, otp) {
  const apiKey = process.env.TWOFACTOR_API_KEY;
  
  if (!apiKey) {
    throw new Error('TWOFACTOR_API_KEY not configured');
  }

  const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '');
  
  const url = `https://2factor.in/API/V1/${apiKey}/SMS/${cleanPhone}/${otp}`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    throw new Error(`2Factor error: ${error.message}`);
  }
}

/**
 * Send SMS using Textlocal (India)
 * Sign up: https://www.textlocal.in/
 */
async function sendTextlocal(phone, message) {
  const apiKey = process.env.TEXTLOCAL_API_KEY;
  const sender = process.env.TEXTLOCAL_SENDER || 'TXTLCL';
  
  if (!apiKey) {
    throw new Error('TEXTLOCAL_API_KEY not configured');
  }

  const cleanPhone = phone.replace(/^\+91/, '').replace(/\D/g, '');
  
  const url = 'https://api.textlocal.in/send/';
  const params = new URLSearchParams({
    apikey: apiKey,
    numbers: cleanPhone,
    sender: sender,
    message: message,
  });

  try {
    const response = await axios.post(url, params);
    return response.data;
  } catch (error) {
    throw new Error(`Textlocal error: ${error.message}`);
  }
}

/**
 * Main function to send SMS using configured provider
 */
async function sendSMS(phone, message, otp = null) {
  const provider = process.env.SMS_PROVIDER || 'console';
  
  console.log(`📱 Sending SMS via ${provider} to ${phone}`);

  try {
    switch (provider.toLowerCase()) {
      case 'fast2sms':
        return await sendFast2SMS(phone, message);
      
      case 'msg91':
        return await sendMSG91(phone, message);
      
      case '2factor':
        if (!otp) throw new Error('OTP required for 2Factor');
        return await send2Factor(phone, otp);
      
      case 'textlocal':
        return await sendTextlocal(phone, message);
      
      case 'twilio':
        // Will use existing Twilio implementation
        throw new Error('Use Twilio client directly');
      
      case 'console':
      default:
        console.log(`📱 Console SMS to ${phone}: ${message}`);
        return { success: true, message: 'Logged to console' };
    }
  } catch (error) {
    console.error(`SMS Send Error (${provider}):`, error.message);
    // Fallback to console
    console.log(`📱 Fallback - SMS to ${phone}: ${message}`);
    throw error;
  }
}

module.exports = { sendSMS };
