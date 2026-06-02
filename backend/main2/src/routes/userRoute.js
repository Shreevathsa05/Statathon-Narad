import { Router } from "express";
import {
    inviteUser,
    listUsers,
    getUser,
    suspendUser,
    deleteUser,
} from "../controllers/userController.js";
import { verifyJWT } from "../middleware/verifyJWT.js";
import { authorise } from "../middleware/authorise.js";

const router = Router();

router.post("/invite", verifyJWT, authorise("admin", "fod", "field_manager"), inviteUser);
router.get("/", verifyJWT, authorise("admin", "fod", "field_manager"), listUsers);
router.get("/:id", verifyJWT, getUser);
router.patch("/:id/suspend", verifyJWT, authorise("admin", "fod", "field_manager"), suspendUser);
router.delete("/:id", verifyJWT, authorise("admin", "fod"), deleteUser);

export default router;
