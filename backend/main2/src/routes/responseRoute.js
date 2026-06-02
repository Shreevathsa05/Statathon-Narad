import { Router } from "express"
import { getAllSurveyResponseBySurveyId, submitSurveyResponse } from "../controllers/responseController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = Router();
router.route("/:survey_id").get(verifyJWT, getAllSurveyResponseBySurveyId).post(submitSurveyResponse);

export default router;