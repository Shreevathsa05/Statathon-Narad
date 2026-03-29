import { Router } from "express"
import { getAllSurveyResponseBySurveyId, submitSurveyResponse } from "../controllers/responseController.js";

const router = Router();
router.route("/:survey_id").get(getAllSurveyResponseBySurveyId).post(submitSurveyResponse);

export default router;