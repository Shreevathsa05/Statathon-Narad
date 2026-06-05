import { OTPVerification } from "../models/OTPVerification.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Generate a random 6-digit numeric OTP.
 * @returns {string}
 */
export const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send an OTP code to a phone number.
 * If Twilio credentials are missing, falls back to logging the OTP for development.
 * @param {string} phone - Target phone number
 * @param {string} otp - The OTP code to send
 * @returns {Promise<boolean>} Success status
 */
export const sendOtp = async (phone, otp) => {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER } = process.env;

  // Save/overwrite OTP record in database with 5 minute expiration
  const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  await OTPVerification.findOneAndUpdate(
    { phone },
    { otp, expiryTime },
    { upsert: true, new: true }
  );

  console.log(`[OTP DEBUG] Generated OTP ${otp} for ${phone}`);

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER || 
      TWILIO_ACCOUNT_SID.startsWith("mock") || TWILIO_AUTH_TOKEN.startsWith("mock")) {
    console.log(`[Twilio Mock] SMS not sent. Retrieve OTP code from console: ${otp}`);
    return true;
  }

  const apiUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const payload = new URLSearchParams({
    From: TWILIO_PHONE_NUMBER,
    To: phone.startsWith("+") ? phone : `+91${phone}`, // default to India prefix if missing
    Body: `Your NARAD verification code is: ${otp}. Valid for 5 minutes.`
  });

  const authHeader = `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64")}`;

  try {
    const response = await axios.post(apiUrl, payload, {
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });
    console.log(`[Twilio SMS] OTP successfully sent to ${phone}. Message SID: ${response.data.sid}`);
    return true;
  } catch (error) {
    console.error("❌ Twilio SMS Service Error:", error.response?.data || error.message);
    throw new Error("Failed to send OTP via Twilio.");
  }
};

/**
 * Verify the OTP entered by the user.
 * @param {string} phone - User phone number
 * @param {string} code - The code to verify
 * @returns {Promise<boolean>} Verification result
 */
export const verifyOtp = async (phone, code) => {
  try {
    const otpRecord = await OTPVerification.findOne({ phone });

    if (!otpRecord) {
      console.log(`[OTP Verification] No OTP found for ${phone}`);
      return false;
    }

    // Check expiry
    if (new Date() > otpRecord.expiryTime) {
      console.log(`[OTP Verification] OTP expired for ${phone}`);
      await OTPVerification.deleteOne({ phone });
      return false;
    }

    if (otpRecord.otp === code.toString().trim()) {
      // Clear OTP on successful verification
      await OTPVerification.deleteOne({ phone });
      return true;
    }

    console.log(`[OTP Verification] Invalid OTP entered for ${phone}. Expected: ${otpRecord.otp}, entered: ${code}`);
    return false;
  } catch (error) {
    console.error("Error verifying OTP:", error.message);
    throw error;
  }
};
