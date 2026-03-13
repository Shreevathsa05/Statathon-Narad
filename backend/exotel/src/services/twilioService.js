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
