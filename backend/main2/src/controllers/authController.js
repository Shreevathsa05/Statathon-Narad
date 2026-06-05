import bcrypt from "bcryptjs";
import { User } from "../models/userSchema.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../utils/jwtHelper.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { hashAadhaar } from "../utils/hash.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Demographics } from "../models/demographics.js";
import twilioClient from "../config/twilio.js";
import { CampaignTarget } from "../models/campaignTarget.js";
import { Survey } from "../models/surveySchema.js";

const COOKIE_OPTS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
};

// Helper: issue tokens + set cookies
async function issueTokens(res, user) {
    const payload = { userId: user._id.toString(), email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken({ userId: user._id.toString() });

    // Store refresh token in DB
    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("accessToken", accessToken, { ...COOKIE_OPTS, maxAge: 60 * 60 * 1000 });          // 1h
    res.cookie("refreshToken", refreshToken, { ...COOKIE_OPTS, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7d

    return { accessToken, user: { id: user._id, email: user.email, role: user.role, name: user.name } };
}

/**
 * POST /api/auth/check-email
 * Returns the status of a user by email — used by FE to decide which form to show.
 */
export const checkEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "Email not registered in NARAD" });

    return res.status(200).json({ status: user.status, role: user.role });
});

/**
 * POST /api/auth/setup-password
 * First-time password creation for pending_setup users.
 */
export const setupPassword = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });
    if (password.length < 8) return res.status(400).json({ message: "Password must be at least 8 characters" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.status !== "pending_setup") {
        return res.status(400).json({ message: "Password already set — use login instead" });
    }

    user.passwordHash = await bcrypt.hash(password, 12);
    user.status = "active";
    const { user: userData } = await issueTokens(res, user);

    return res.status(200).json({ message: "Password set successfully", user: userData });
});

/**
 * POST /api/auth/login
 */
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: "Email and password are required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    if (user.status === "pending_setup") {
        return res.status(400).json({ message: "Please set your password first", status: "pending_setup" });
    }
    if (user.status === "suspended") {
        return res.status(403).json({ message: "Account suspended — contact admin" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: "Invalid credentials" });

    const { user: userData } = await issueTokens(res, user);
    return res.status(200).json({ message: "Login successful", user: userData });
});

/**
 * GET /api/auth/refresh
 * Issues a new accessToken from a valid refreshToken cookie.
 */
export const refresh = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (!token) return res.status(401).json({ message: "No refresh token" });

    let decoded;
    try {
        decoded = verifyToken(token, "refresh");
    } catch {
        return res.status(401).json({ message: "Invalid or expired refresh token" });
    }

    const user = await User.findById(decoded.userId);
    if (!user || user.refreshToken !== token) {
        return res.status(401).json({ message: "Refresh token revoked" });
    }
    if (user.status === "suspended") {
        return res.status(403).json({ message: "Account suspended" });
    }

    const { signAccessToken: _ } = await import("../utils/jwtHelper.js");
    const newAccessToken = signAccessToken({ userId: user._id.toString(), email: user.email, role: user.role });
    res.cookie("accessToken", newAccessToken, { ...COOKIE_OPTS, maxAge: 60 * 60 * 1000 });

    return res.status(200).json({ message: "Token refreshed" });
});

/**
 * POST /api/auth/logout
 */
export const logout = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId);
    if (user) {
        user.refreshToken = null;
        await user.save();
    }
    res.clearCookie("accessToken");
    res.clearCookie("refreshToken");
    return res.status(200).json({ message: "Logged out" });
});

/**
 * GET /api/auth/me
 */
export const me = asyncHandler(async (req, res) => {
    return res.status(200).json({ user: req.user });
});

// aadhar/phone verification

// POST /auth/start
export const startAuth = asyncHandler(async (req, res) => {
    const { value, mode } = req.body;
    const { surveyId } = req.params;

    if (!value || !mode) {
        throw new ApiError(400, "Aadhar/Phone is required");
    }

    if (!surveyId) {
        throw new ApiError(400, "surveyId is required");
    }

    const survey = await Survey.findOne({ surveyId });
    if (!survey) {
        throw new ApiError(404, "Survey not found");
    }

    let user;
    if (mode === "aadhaar") {
        const clean = value.replace(/\D/g, "");
        const hashedAadhaar = hashAadhaar(clean);
        user = await Demographics.findOne({ aadhaarNo: hashedAadhaar });
    } else if (mode === "phone") {
        user = await Demographics.findOne({ phone: value });
    }
    let phoneToVerify;
    if (user) {
        phoneToVerify = user.phone;
        const campaignUser = await CampaignTarget.exists({
            surveyId: survey._id,
            userKey: user.aadhaarNo
        });

        if (!campaignUser) {
            throw new ApiError(403, "You are not eligible for this survey");
        }
    } else {
        if (mode === "aadhaar") {
            return res.status(200).json(
                new ApiResponse(200, null, "User not found, proceed with phone input")
            );
        } else if (mode === "phone") {
            phoneToVerify = value;
        }
    }

    // Trigger Twilio OTP
    const twilioServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (twilioClient && twilioServiceSid) {
        try {
            await twilioClient.verify.v2.services(twilioServiceSid)
                .verifications.create({ to: `+91${phoneToVerify}`, channel: 'sms' });
        } catch (err) {
            console.error("Twilio Verification Error:", err);
            throw new ApiError(500, "Failed to send OTP via Twilio");
        }
    }

    return res.status(200).json(
        new ApiResponse(200, { phone: `+91${phoneToVerify}` }, "OTP sent successfully")
    );
});

export const completeAuth = asyncHandler(async (req, res) => {
    const { value, mode, otp } = req.body;

    if (!value || !mode || !otp) {
        throw new ApiError(400, "Aadhaar/Phone and OTP are required");
    }

    let user;
    let phoneToVerify;

    if (mode === "aadhaar") {
        const clean = value.replace(/\D/g, "");
        const hashedAadhaar = hashAadhaar(clean);
        user = await Demographics.findOne({ aadhaarNo: hashedAadhaar });
        if (user) phoneToVerify = user.phone;
    } else if (mode === "phone") {
        user = await Demographics.findOne({ phone: value });
        phoneToVerify = value;
    }

    if (!phoneToVerify) {
        throw new ApiError(400, "Could not determine phone number to verify");
    }

    // Verify OTP with Twilio
    const twilioServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (twilioClient && twilioServiceSid) {
        try {
            const verificationCheck = await twilioClient.verify.v2.services(twilioServiceSid)
                .verificationChecks.create({ to: `+91${phoneToVerify}`, code: otp });

            if (verificationCheck.status !== 'approved') {
                throw new ApiError(401, "Invalid OTP code");
            }
        } catch (err) {
            console.error("Twilio Check Error:", err);
            throw new ApiError(401, "OTP Verification Failed");
        }
    }

    if (user) {

        return res.status(200).json(
            new ApiResponse(200, {
                demographic: {
                    fullname: user.fullName,
                    age: user.age,
                    gender: user.gender,
                    primarylanguage: user.primaryLanguage,
                    pincode: user.pincode,
                    area: user.area,
                }
            }, "Existing user verified")
        );
    }

    return res.status(200).json(
        new ApiResponse(200, {
            demographic: null,
        }, "New user verified")
    );
})