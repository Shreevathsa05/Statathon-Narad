import { sendSmsOtp } from "../services/twilioService.js";

// Temporary in-memory store for OTPs (Phone Number -> OTP)
// Format: { "+919876543210": "123456" }
const otpStorage = new Map();

export const requestOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required." });
    }

    // Generate a random 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save to our temporary storage
    otpStorage.set(phoneNumber, otpCode);

    // Send the SMS
    await sendSmsOtp(phoneNumber, otpCode);

    res.status(200).json({ message: "OTP sent successfully." });
  } catch (error) {
    console.error("OTP Request Error:", error.message);
    res.status(500).json({ error: "Internal Server Error while sending OTP." });
  }
};

export const verifyOtp = (req, res) => {
  const { phoneNumber, code } = req.body;

  if (!phoneNumber || !code) {
    return res
      .status(400)
      .json({ error: "Phone number and code are required." });
  }

  const storedOtp = otpStorage.get(phoneNumber);

  if (!storedOtp) {
    return res
      .status(400)
      .json({ error: "No OTP requested for this number or it expired." });
  }

  if (storedOtp === code.toString()) {
    // Success! Clear the OTP so it can't be reused
    otpStorage.delete(phoneNumber);

    // TODO: Generate a JWT token here and send it to the client
    return res.status(200).json({
      message: "Authentication successful!",
      token: "mock-jwt-token-123",
    });
  } else {
    return res.status(401).json({ error: "Invalid OTP code." });
  }
};
