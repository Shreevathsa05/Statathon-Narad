import { Router } from "express"
import { getAllSurveyResponseBySurveyId, submitSurveyResponse, scanAndFetchFlaggedResponses } from "../controllers/responseController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = Router();
router.route("/:survey_id").get(verifyJWT, getAllSurveyResponseBySurveyId).post(submitSurveyResponse);
router.route("/:survey_id/scan").post(verifyJWT, scanAndFetchFlaggedResponses);

export default router;