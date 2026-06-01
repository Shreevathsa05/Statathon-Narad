/**
 * Seed script — run ONCE on first deploy.
 * Creates admin@mospi.gov and a service account, prints the service token.
 *
 * Usage:
 *   node --experimental-vm-modules src/scripts/seedAdmin.js
 *   (or just: node src/scripts/seedAdmin.js  if "type":"module" is set)
 */

import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { User } from "../models/userSchema.js";


const DB_NAME = process.env.DB_NAME || "statathon";

async function seed() {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    console.log("✅ Connected to MongoDB\n");

    // ── 1. Root Admin ──────────────────────────────────────────────
    const adminEmail = "admin@mospi.gov";
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || "Admin@1234";

    const existing = await User.findOne({ email: adminEmail });
    if (existing) {
        console.log(`ℹ️  Admin already exists: ${adminEmail}`);
    } else {
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        await User.create({
            name: "Root Admin",
            email: adminEmail,
            role: "admin",
            passwordHash,
            status: "active",
        });
        console.log(`✅ Admin created: ${adminEmail}`);
        console.log(`   Password: ${adminPassword}  ← CHANGE THIS IMMEDIATELY\n`);
    }


    await mongoose.disconnect();
    console.log("✅ Seed complete.");
}

seed().catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
});
