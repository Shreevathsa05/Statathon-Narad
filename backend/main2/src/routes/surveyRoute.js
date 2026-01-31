import { Router } from "express"
import { createSurvey, getAllSurveys, getSurveyById } from "../methods/surveyController.js";

const router = Router();

router.route("/").post(createSurvey).get(getAllSurveys);
router.route("/:survey_id").get(getSurveyById);
export default router;