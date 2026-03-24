import { Router } from "express"
import { createSurvey, getAllSurveys, getSurveyById, updateSurvey, deleteSurvey } from "../controllers/surveyController.js";

const router = Router();

router.route("/").post(createSurvey).get(getAllSurveys);
router.route("/:survey_id").get(getSurveyById).patch(updateSurvey).delete(deleteSurvey);
export default router;