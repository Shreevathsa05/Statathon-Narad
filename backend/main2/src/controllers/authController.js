import bcrypt from "bcryptjs";
import { User } from "../models/userSchema.js";
import { signAccessToken, signRefreshToken, verifyToken } from "../utils/jwtHelper.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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
