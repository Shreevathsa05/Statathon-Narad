import { Router } from "express"
import { createSurvey, getSurveyById, generateAudioForSurvey } from "../methods/surveyController.js";

const router = Router();

router.route("/").post(createSurvey);
router.route("/:survey_id").get(getSurveyById);
router.post("/:survey_id/audio", generateAudioForSurvey);

export default router;
