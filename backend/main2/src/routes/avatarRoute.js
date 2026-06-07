import { Router } from "express";
import { triggerAvatarSurvey } from "../controllers/avatarController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = Router();
router.use(verifyJWT);

// API ready for future FOD integration
router.post("/trigger/:surveyId", triggerAvatarSurvey);

export default router;
