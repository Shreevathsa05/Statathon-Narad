import { Router } from "express";
import {
    checkEmail,
    setupPassword,
    login,
    refresh,
    logout,
    me,
} from "../controllers/authController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = Router();

router.post("/check-email", checkEmail);
router.post("/setup-password", setupPassword);
router.post("/login", login);
router.get("/refresh", refresh);
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, me);

export default router;
