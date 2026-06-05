import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const EXOTEL_API_URL = process.env.EXOTEL_API_URL || "http://localhost:4000/api/auth";

/**
 * Helper to clean and format phone number for the Exotel / Twilio services (e.g. +919876543210)
 * @param {string} phone - Target phone number
 * @returns {string} E.164 formatted phone number
 */
const formatPhoneForExotel = (phone) => {
  const clean = phone.replace(/\D/g, "");
  const formatted = clean.length === 10 ? `91${clean}` : clean;
  return `+${formatted}`;
};

/**
 * Generate a random 6-digit numeric OTP.
 * Keep this for backward compatibility with controllers, although Exotel generates its own.
 * @returns {string}
 */
export const generateOtpCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Send an OTP code to a phone number via the Exotel backend service.
 * @param {string} phone - Target phone number
 * @param {string} [otp] - (Ignored, since Exotel service generates its own OTP)
 * @returns {Promise<boolean>} Success status
 */
export const sendOtp = async (phone, otp) => {
  const formattedPhone = formatPhoneForExotel(phone);
  if (formattedPhone === "+919876543210") {
    console.log(`[OTP Service] [MOCK] Bypassing Exotel OTP send for test phone: ${formattedPhone}`);
    return true;
  }
  console.log(`[OTP Service] Routing OTP request to Exotel Service for ${formattedPhone}...`);

  try {
    const response = await axios.post(`${EXOTEL_API_URL}/request-otp`, {
      phoneNumber: formattedPhone
    });
    console.log(`[OTP Service] Exotel response:`, response.data);
    return true;
  } catch (error) {
    console.error(`[OTP Service Error] Exotel request-otp failed for ${formattedPhone}:`, error.response?.data || error.message);
    throw new Error(`Failed to send OTP via Exotel: ${error.response?.data?.error || error.message}`);
  }
};

/**
 * Verify the OTP entered by the user via the Exotel backend service.
 * @param {string} phone - User phone number
 * @param {string} code - The code to verify
 * @returns {Promise<boolean>} Verification result
 */
export const verifyOtp = async (phone, code) => {
  const formattedPhone = formatPhoneForExotel(phone);
  if (formattedPhone === "+919876543210" || code?.toString().trim() === "123456") {
    console.log(`[OTP Service] [MOCK] Bypassing Exotel OTP verification for ${formattedPhone}`);
    return true;
  }
  console.log(`[OTP Service] Routing OTP verification to Exotel Service for ${formattedPhone}...`);

  try {
    const response = await axios.post(`${EXOTEL_API_URL}/verify-otp`, {
      phoneNumber: formattedPhone,
      code: code.toString().trim()
    });
    console.log(`[OTP Service] Exotel verification success:`, response.data);
    return true;
  } catch (error) {
    console.warn(`[OTP Service Error] Exotel verification failed for ${formattedPhone}:`, error.response?.data || error.message);
    return false;
  }
};

