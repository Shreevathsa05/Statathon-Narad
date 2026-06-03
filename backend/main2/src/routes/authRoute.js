import { Router } from "express";
import {
    checkEmail,
    setupPassword,
    login,
    refresh,
    logout,
    me,
    startAuth,
    completeAuth,
} from "../controllers/authController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = Router();

router.post("/check-email", checkEmail);
router.post("/setup-password", setupPassword);
router.post("/login", login);
router.get("/refresh", refresh);
router.post("/logout", verifyJWT, logout);
router.get("/me", verifyJWT, me);

router.post("/start/:surveyId", startAuth);
router.post("/complete/:surveyId", completeAuth);

export default router;
