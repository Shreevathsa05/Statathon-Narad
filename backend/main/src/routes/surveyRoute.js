import { Router } from "express"
import { getSurveyById } from "../methods/surveyController.js";

const router = Router();

router.route("/:survey_id").get(getSurveyById);
export default router;