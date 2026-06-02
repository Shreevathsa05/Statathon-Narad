import jwt from "jsonwebtoken";

const ACCESS_SECRET = () => process.env.JWT_SECRET;
const REFRESH_SECRET = () => process.env.JWT_REFRESH_SECRET;

export function signAccessToken(payload) {
    return jwt.sign(payload, ACCESS_SECRET(), { expiresIn: "1h" });
}

export function signRefreshToken(payload) {
    return jwt.sign(payload, REFRESH_SECRET(), { expiresIn: "7d" });
}



/**
 * @param {string} token
 * @param {"access"|"refresh"} type
 * @returns decoded payload
 * @throws if invalid or expired
 */
export function verifyToken(token, type = "access") {
    const secret = type === "refresh" ? REFRESH_SECRET() : ACCESS_SECRET();
    return jwt.verify(token, secret);
}
