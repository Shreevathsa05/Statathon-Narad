/**
 * RBAC guard — checks req.user.role is in the allowed list.
 * Must be used AFTER verifyJWT.
 *
 * Usage: router.get("/route", verifyJWT, authorise("admin", "cqcd"), handler)
 */
export const authorise = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorised" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Forbidden — requires one of: ${roles.join(", ")}`,
            });
        }
        next();
    };
};
