import { verifyToken } from "../utils/jwtHelper.js";
import { User } from "../models/userSchema.js";
import { ApiError } from "../utils/ApiError.js";

export const verifyJWT = async (req, res, next) => {
    try {
        // 1. Check for token in cookie or query (for SSE)
        let token = req.cookies?.accessToken || req.query?.token;

        if (!token) {
            return res.status(401).json({ message: "Unauthorised — no token provided" });
        }

        // 2. Verify signature + expiry
        const decoded = verifyToken(token, "access");

        // 3. Load user from DB and check they're still active
        const user = await User.findById(decoded.userId).select("-passwordHash -refreshToken");
        if (!user) {
            return res.status(401).json({ message: "Unauthorised — user not found" });
        }
        if (user.status === "suspended") {
            return res.status(403).json({ message: "Forbidden — account suspended" });
        }

        // 4. Attach to request
        req.user = {
            userId: user._id.toString(),
            email: user.email,
            role: user.role,
            name: user.name,
        };

        next();
    } catch (err) {
        return res.status(401).json({ message: "Unauthorised — invalid or expired token" });
    }
};
