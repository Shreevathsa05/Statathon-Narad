import express from "express";
import { requestOtp, verifyOtp } from "../controllers/authController.js";

const router = express.Router();

// Route to trigger sending the SMS OTP
// POST http://localhost:3000/api/auth/request-otp
router.post("/request-otp", requestOtp);

// Route to verify the code the user enters
// POST http://localhost:3000/api/auth/verify-otp
router.post("/verify-otp", verifyOtp);

export default router;
