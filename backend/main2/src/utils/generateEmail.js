import { User } from "../models/userSchema.js";

const ROLE_PREFIX = {
    admin: "admin",
    sdrd: "sdrd",
    fod: "fod",
    field_manager: "fm",
    field_agent: "fa",
    dpd: "dpd",
    cqcd: "cqcd",
    service: "service",
};

/**
 * Slugify a name: lowercase, strip non-alphanumeric, collapse to single word.
 * "Priya Sharma" → "priya"  (first name only for brevity)
 */
function slugify(name) {
    return name
        .toLowerCase()
        .split(/\s+/)[0]          // use first name only
        .replace(/[^a-z0-9]/g, ""); // strip special chars
}

/**
 * Generate a unique @mospi.gov email for a given role + full name.
 * Handles collisions by appending a numeric suffix.
 * @param {string} name
 * @param {string} role
 * @returns {Promise<string>} e.g. "sdrd.priya@mospi.gov"
 */
export async function generateEmail(name, role) {
    const prefix = ROLE_PREFIX[role];
    if (!prefix) throw new Error(`Unknown role: ${role}`);

    // Admin is always singular
    if (role === "admin") return "admin@mospi.gov";

    const slug = slugify(name);
    if (!slug) throw new Error("Name produces an empty slug");

    const base = `${prefix}.${slug}@mospi.gov`;

    // Check collision
    const existing = await User.findOne({ email: base });
    if (!existing) return base;

    // Find next available suffix
    let n = 2;
    while (true) {
        const candidate = `${prefix}.${slug}${n}@mospi.gov`;
        const clash = await User.findOne({ email: candidate });
        if (!clash) return candidate;
        n++;
    }
}
