import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import ttsRoutes from "./routes/tts.routes.js";
console.log("API Key loaded:", process.env.SARVAM_API_KEY ? "YES" : "NO");
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors({ origin: "*" })); // Adjust origin for production security later
app.use(express.json());
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// ---- Static Files ----

// 1. Serve 'public' from src (if you have frontend files there)
app.use(express.static(path.join(__dirname, "public")));

// 2. Serve 'audio' from ../audio (The folder outside src)
// __dirname is '.../delivery/src'
// path.join goes up one level to '.../delivery/audio'
app.use("/audio", express.static(path.join(__dirname, "..", "audio")));

// ---- Routes ----
app.use("/api", ttsRoutes);

// ---- Health check ----
app.get("/", (req, res) => {
  res.send("Server is running...");
});

// ---- Server ----
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(
    `Audio files will be saved in: ${path.join(__dirname, "..", "audio")}`
  );
});
