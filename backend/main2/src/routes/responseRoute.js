import { Router } from "express"
import { getSurveyResponseById, submitSurveyResponse } from "../methods/responseController.js";

const router = Router();
router.route("/:survey_id").get(getSurveyResponseById).post(submitSurveyResponse);

export default router;