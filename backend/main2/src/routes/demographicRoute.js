import { Router } from "express";
import { createDemographic, getDemographic } from "../controllers/demographicController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";

const router = Router();

router.route("/").post(createDemographic);
router.get("/lookup", getDemographic);

export default router;