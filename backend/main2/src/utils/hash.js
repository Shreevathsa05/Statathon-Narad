import crypto from "crypto";

export const hashAadhaar = (aadhaar) => {
    return crypto
        .createHash("sha256")
        .update(aadhaar)
        .digest("hex");
};