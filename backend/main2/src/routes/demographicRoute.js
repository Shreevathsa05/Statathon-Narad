import { Router } from "express";
import { createDemographic, getDemographic } from "../controllers/demographicController.js";

const router = Router();

router.post("/", createDemographic);
router.get("/lookup", getDemographic);

export default router;