import { Router } from "express";
import { generateTargetsFromDemographics, uploadCampaignExcel, getCampaignTargets } from "../controllers/campaignController.js";
import { upload } from "../middleware/multer.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = Router();
router.use(verifyJWT);

router.post(
    "/upload/:surveyId",
    upload.single("file"),
    uploadCampaignExcel
);

router.post("/generate/:surveyId", generateTargetsFromDemographics);
router.get("/targets/:surveyId", getCampaignTargets);

export default router;