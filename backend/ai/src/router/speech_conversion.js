// router for question generation
import { Router } from "express";
import stt_from_twilio_whisper, { stt_from_twilio_sarvam } from "../utils/stt.js";
const speech_conversion_router = Router();

// health 
speech_conversion_router.get('/', (req, res) => {
    res.json("Speech Generation Route Active")
})

// stt from twilio
speech_conversion_router.post('/stt-twilio', async (req, res) => {
    const { url } = req.body;
    const transcription = await stt_from_twilio_whisper(url);
    res.json(transcription);
})

speech_conversion_router.post('/stt-twilio-sarvam', async (req, res) => {
    const { url } = req.body;
    const transcription = await stt_from_twilio_sarvam(url);
    res.json(transcription);
})

// tts

export default speech_conversion_router;