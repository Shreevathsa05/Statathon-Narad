import { Router } from "express"
import { getAllSurveyResponseBySurveyId, submitSurveyResponse, getFlaggedResponsesBySurveyId } from "../controllers/responseController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

import multer from "multer";

const upload = multer({ dest: "uploads/" }); // Temporary local storage before processing

const router = Router();
router.route("/:survey_id")
    .get(verifyJWT, getAllSurveyResponseBySurveyId)
    .post(upload.any(), submitSurveyResponse);
router.route("/:survey_id/flagged").get(verifyJWT, getFlaggedResponsesBySurveyId);

export default router;