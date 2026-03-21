import express from "express";
import {
  initiateCall,
  handleCallConnect,
  handleRecording,
} from "../controllers/callController.js";

const router = express.Router();

// Route you call to trigger the system
// POST http://localhost:3000/api/survey/start-call
router.post("/start-call", initiateCall);

// Webhook 1: Exotel asks what to do when the call connects
// POST <ngrok-url>/api/survey/webhook/start
router.post("/webhook/start", handleCallConnect);

// Webhook 2: Exotel sends the recording details here
// POST <ngrok-url>/api/survey/webhook/save-recording
router.post("/webhook/save-recording", handleRecording);

export default router;
