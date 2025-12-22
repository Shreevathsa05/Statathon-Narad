import express from "express";
import { generateAudioFile } from "../service/ttsService.js";

const router = express.Router();

router.post("/tts", async (req, res) => {
  try {
    const { text, language } = req.body;

    if (!text?.trim() || !language) {
      return res.status(400).json({
        error: "Valid text and language required",
      });
    }

    // Call the shared service instead of rewriting the logic
    const audioUrl = await generateAudioFile(text, language);

    if (!audioUrl) {
      return res.status(500).json({
        error: "Failed to generate speech (Check server logs)",
      });
    }

    res.json({ audioUrl });
  } catch (err) {
    console.error("TTS Route error:", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
