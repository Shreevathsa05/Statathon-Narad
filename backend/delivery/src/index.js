import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import ttsRoutes from "./routes/tts.routes.js";

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---- Middlewares ----
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ---- Static files ----
app.use(express.static(path.join(__dirname, "public")));
app.use("/audio", express.static(path.join(__dirname, "audio")));

// ---- Routes ----
app.use("/api", ttsRoutes);

// ---- Health check ----
app.get("/", (req, res) => {
  res.send("Server running");
});

// ---- Server ----
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
