import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Triggers an outbound phone call via Exotel's REST API.
 * * @param {string} toNumber - The citizen's phone number.
 * @param {string} webhookUrl - The URL Exotel hits when the call connects.
 * @returns {Promise<Object>} The Exotel API response.
 */
export const triggerOutboundCall = async (toNumber, webhookUrl) => {
  const { EXOTEL_SID, EXOTEL_API_KEY, EXOTEL_API_TOKEN, EXOTEL_CALLER_ID } =
    process.env;

  if (!EXOTEL_SID || !EXOTEL_API_KEY) {
    throw new Error("Missing critical Exotel API credentials in .env");
  }

  const apiUrl = `https://api.exotel.com/v1/Accounts/${EXOTEL_SID}/Calls/connect.json`;

  // Exotel v1 requires application/x-www-form-urlencoded data
  const payload = new URLSearchParams({
    From: EXOTEL_CALLER_ID,
    To: toNumber,
    Url: webhookUrl,
    CallType: "trans", // trans = transactional call route
  });

  try {
    const response = await axios.post(apiUrl, payload, {
      auth: {
        username: EXOTEL_API_KEY,
        password: EXOTEL_API_TOKEN,
      },
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    console.log(`✅ Outbound call successfully queued to ${toNumber}`);
    return response.data;
  } catch (error) {
    console.error(
      "❌ Exotel API Error:",
      error.response?.data || error.message,
    );
    throw new Error("Failed to trigger outbound call via Exotel.");
  }
};
