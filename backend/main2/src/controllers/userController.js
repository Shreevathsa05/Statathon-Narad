import { User } from "../models/userSchema.js";
import { generateEmail } from "../utils/generateEmail.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Which roles can invite which roles
const CAN_INVITE = {
    admin: ["sdrd", "fod", "dpd", "cqcd", "field_manager", "field_agent"],
    fod: ["field_manager"],
    field_manager: ["field_agent"],
};

/**
 * POST /api/users/invite
 * Creates a new pending_setup user. Returns the generated email.
 */
export const inviteUser = asyncHandler(async (req, res) => {
    const { name, role, region } = req.body;
    const callerRole = req.user.role;

    if (!name || !role) return res.status(400).json({ message: "name and role are required" });

    const allowed = CAN_INVITE[callerRole] || [];
    if (!allowed.includes(role)) {
        return res.status(403).json({ message: `${callerRole} cannot invite role: ${role}` });
    }

    const email = await generateEmail(name, role);

    const newUser = await User.create({
        name: name.trim(),
        email,
        role,
        region: region || null,
        assignedBy: req.user.userId,
        managerId: role === "field_agent" && callerRole === "field_manager" ? req.user.userId : null,
    });

    return res.status(201).json({
        message: "User created — share this email with the user to let them set their password",
        user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role,
            status: newUser.status,
        },
    });
});

/**
 * GET /api/users/
 * Returns users scoped to caller:
 *   admin → all users
 *   fod   → field_managers assigned by this fod
 *   field_manager → field_agents under this manager
 */
export const listUsers = asyncHandler(async (req, res) => {
    const { role, userId } = req.user;

    let query = {};
    if (role === "admin") {
        query = {}; // all
    } else if (role === "fod") {
        query = { role: "field_manager", assignedBy: userId };
    } else if (role === "field_manager") {
        query = { role: "field_agent", managerId: userId };
    } else {
        return res.status(403).json({ message: "Forbidden" });
    }

    const users = await User.find(query)
        .select("-passwordHash -refreshToken")
        .sort({ createdAt: -1 });

    return res.status(200).json({ users });
});

/**
 * GET /api/users/:id
 */
export const getUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select("-passwordHash -refreshToken");
    if (!user) return res.status(404).json({ message: "User not found" });
    return res.status(200).json({ user });
});

/**
 * PATCH /api/users/:id/suspend
 */
export const suspendUser = asyncHandler(async (req, res) => {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });

    // Prevent self-suspension and admin suspension
    if (target._id.toString() === req.user.userId) {
        return res.status(400).json({ message: "Cannot suspend yourself" });
    }
    if (target.role === "admin") {
        return res.status(403).json({ message: "Cannot suspend root admin" });
    }

    target.status = target.status === "suspended" ? "active" : "suspended";
    target.refreshToken = null; // revoke sessions
    await target.save();

    return res.status(200).json({
        message: `User ${target.status === "suspended" ? "suspended" : "reactivated"}`,
        status: target.status,
    });
});

/**
 * DELETE /api/users/:id
 */
export const deleteUser = asyncHandler(async (req, res) => {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target.role === "admin") return res.status(403).json({ message: "Cannot delete root admin" });
    if (target._id.toString() === req.user.userId) {
        return res.status(400).json({ message: "Cannot delete yourself" });
    }

    await User.findByIdAndDelete(req.params.id);
    return res.status(200).json({ message: "User deleted" });
});
