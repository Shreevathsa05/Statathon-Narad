import mongoose from "mongoose";

const ROLES = ["admin", "sdrd", "fod", "field_manager", "field_agent", "dpd", "cqcd", "service"];

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        role: {
            type: String,
            enum: ROLES,
            required: true,
        },
        passwordHash: {
            type: String,
            default: null, // null until first setup
        },
        status: {
            type: String,
            enum: ["pending_setup", "active", "suspended"],
            default: "pending_setup",
        },
        assignedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        // FOD hierarchy extras
        region: {
            type: String,
            default: null, // optional NSS region code for Field Managers/Agents
        },
        managerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null, // field_agent → their field_manager
        },
        // Token storage
        refreshToken: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

export const User = mongoose.model("User", UserSchema);
