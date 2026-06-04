import { Router } from "express"
import { createSurvey, getAllSurveys, getSurveyById, updateSurvey, deleteSurvey } from "../controllers/surveyController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = Router();

router.route("/").post(verifyJWT, createSurvey).get(getAllSurveys);
router.route("/:survey_id").get(getSurveyById).patch(verifyJWT, updateSurvey).delete(verifyJWT, deleteSurvey);
export default router;