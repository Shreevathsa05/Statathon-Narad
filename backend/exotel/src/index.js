import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

// Important: Import the routes (we will build this file in Batch 2)
import surveyRoutes from "./routes/surveyRoutes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Security and Parsing Middlewares
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Essential for Exotel's POST requests

// Serve local audio files statically for Exotel to download
app.use("/audio", express.static(path.join(__dirname, "public/audio")));

// Mount the API routes
app.use("/api/survey", surveyRoutes);

// Health check endpoint
app.get("/", (req, res) => {
  res.json({ status: "NARAD Delivery Service running normally." });
});

// Start listening
app.listen(PORT, () => {
  console.log(`🚀 Server up on port ${PORT}`);
  console.log(`📂 Audio folder hosted at: /audio`);
});
