import express from "express";
import {
  triggerIvrSurvey,
  handleCallConnect,
  handleAnswer,
  handleCallStatus,
  proxyAudio
} from "../controllers/callController.js";

const router = express.Router();

// Route you call from frontend to trigger the system
// POST http://localhost:4000/api/survey/trigger-ivr-survey
router.post("/trigger-ivr-survey", triggerIvrSurvey);

// Webhook 1: Twilio asks what to do when the call connects
// POST <ngrok-url>/api/survey/webhook/start
router.post("/webhook/start", handleCallConnect);

// Webhook 2: Twilio sends the recording details here after every question
// POST <ngrok-url>/api/survey/webhook/answer
router.post("/webhook/answer", handleAnswer);

// Webhook 3: StatusCallback for call drops/hangups
// POST <ngrok-url>/api/survey/webhook/status
router.post("/webhook/status", handleCallStatus);

// Audio Proxy: Proxies audio from AI service MinIO to Twilio
// GET <ngrok-url>/api/survey/proxy-audio
router.get("/proxy-audio", proxyAudio);

export default router;
