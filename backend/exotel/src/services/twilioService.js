import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

export const triggerOutboundCall = async (toNumber, webhookUrl) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } =
    process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Missing Twilio credentials in .env");
  }

  const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;

  const payload = new URLSearchParams({
    From: TWILIO_PHONE_NUMBER,
    To: toNumber, // Must include country code, e.g., +919876543210
    Url: webhookUrl,
  });

  // Twilio uses standard Basic Auth encoding
  const authHeader = `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`;

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log(`✅ Twilio call queued to ${toNumber}`);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Twilio API Error:",
      error.response?.data || error.message,
    );
    throw new Error("Failed to trigger outbound call via Twilio.");
  }
};

/**
 * Sends an SMS OTP via Twilio's REST API.
 * @param {string} toNumber - The citizen's phone number (e.g., +919876543210).
 * @param {string} otpCode - The generated OTP to send.
 * @returns {Promise<Object>} The Twilio API response.
 */
export const sendSmsOtp = async (toNumber, otpCode) => {
    const { 
        TWILIO_ACCOUNT_SID, 
        TWILIO_AUTH_TOKEN, 
        TWILIO_PHONE_NUMBER 
    } = process.env;

    const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;

    const payload = new URLSearchParams({
        From: TWILIO_PHONE_NUMBER,
        To: toNumber,
        Body: `Your NARAD verification code is: ${otpCode}. Valid for 5 minutes.`
    });

    const authHeader = `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`;

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: {
                'Authorization': authHeader,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        console.log(`✉️ SMS OTP sent successfully to ${toNumber}`);
        return response.data;
        
    } catch (error) {
        console.error('❌ Twilio SMS Error:', error.response?.data || error.message);
        throw new Error('Failed to send SMS via Twilio.');
    }
};