import { Router } from "express";

const dbRouter = Router();

dbRouter.get("/", async (req, res) => {
    res.json("Working");
});

export default dbRouter;
