import { Router } from "express"
import { getAllSurveyResponseBySurveyId, submitSurveyResponse, getFlaggedResponsesBySurveyId } from "../controllers/responseController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = Router();
router.route("/:survey_id").get(verifyJWT, getAllSurveyResponseBySurveyId).post(submitSurveyResponse);
router.route("/:survey_id/flagged").get(verifyJWT, getFlaggedResponsesBySurveyId);

export default router;