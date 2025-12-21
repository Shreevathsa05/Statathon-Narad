import { Router } from "express"
import { createSurvey, getSurveyById } from "../methods/surveyController.js";

const router = Router();

router.route("/").post(createSurvey);
router.route("/:survey_id").get(getSurveyById);
export default router;