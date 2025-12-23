import express from "express";
import { generateAudioFile } from "../service/ttsService.js";
import axios from "axios";

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

router.post("/tts/:surveyId", async (req, res) => {
  try {
    const { surveyId } = req.params;
    const { language } = req.body;

    if (!language) {
      return res.status(400).json({
        error: "language is required",
      });
    }

    // 1. Fetch survey from Survey Service
    const surveyResp = await axios.get(
      `http://localhost:3000/api/survey/${surveyId}`
    );

    const survey = surveyResp.data.data;

    if (!survey?.questions?.length) {
      return res.status(404).json({
        error: "No questions found in survey",
      });
    }

    const results = [];

    // 2. Loop through all questions (SEQUENTIAL on purpose)
    for (const question of survey.questions) {
      const qid = question.qid;

      const questionText = question.text?.[language];
      if (!questionText) {
        console.warn(
          `Skipping question ${qid}: no text for language ${language}`
        );
        continue;
      }

      // 3. Generate audio
      const audioUrl = await generateAudioFile(questionText, language);

      if (!audioUrl) {
        console.error(`TTS failed for question ${qid}`);
        continue;
      }

      results.push({
        qid,
        audioUrl,
      });
    }

    // 4. Return result
    res.json({
      surveyId,
      language,
      questions: results,
    });
  } catch (err) {
    console.error("Survey TTS error:", err.message);
    res.status(500).json({
      error: "Failed to generate survey audio",
    });
  }
});


export default router;
