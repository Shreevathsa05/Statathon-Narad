import express from "express";
import axios from "axios";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";



const router = express.Router();



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log("ENV PATH USED:", path.join(__dirname, "../.env"));

dotenv.config({
  path: path.join(__dirname, "../../.env"),
});


const LANGUAGE_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  mr: "mr-IN",
};


console.log("SARVAM KEY LOADED:", !!process.env.SARVAM_API_KEY);

// Ensure audio directory exists
const ttsDir = path.join(__dirname, "..", "audio", "tts");
if (!fs.existsSync(ttsDir)) {
  fs.mkdirSync(ttsDir, { recursive: true });
}

router.post("/tts", async (req, res) => {
  try {
    const { text, language } = req.body;

    if (!text?.trim() || !language) {
      return res.status(400).json({
        error: "Valid text and language required",
      });
    }

    const sarvamLanguage = LANGUAGE_MAP[language];
    if (!sarvamLanguage) {
      return res.status(400).json({
        error: "Unsupported language",
      });
    }

    const sarvamResponse = await axios.post(
      "https://api.sarvam.ai/text-to-speech",
      {
        text: text.trim(),
        language: sarvamLanguage,
        voice: "female",
        format: "mp3",
      },
      {
        headers: {
          "api-subscription-key": process.env.SARVAM_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    const base64Audio = sarvamResponse.data.audios?.[0];
    if (!base64Audio) {
      return res.status(500).json({
        error: "No audio received from Sarvam",
      });
    }

    const audioBuffer = Buffer.from(base64Audio, "base64");
    const fileName = `${language}_${Date.now()}.mp3`;
    const filePath = path.join(ttsDir, fileName);

    fs.writeFileSync(filePath, audioBuffer);

    res.json({
      audioUrl: `/audio/tts/${fileName}`,
    });
  } catch (err) {
    console.error("TTS error:", err.response?.data || err.message);
    res.status(500).json({ error: "Failed to generate speech" });
  }
});

export default router;
