// router for question generation
import { Router } from "express";
import minioClient from "../utils/minio/client.js";
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
speech_conversion_router.get('/audio/:surveyId/:audioId', (req, res) => {
    const bucketName = process.env.MINIO_BUCKET_NAME;

    // Handle cases where audioId might already include the .mp3 extension
    let audioId = req.params.audioId;
    let surveyId = req.params.surveyId;
    if (audioId.endsWith('.mp3')) {
        audioId = audioId.slice(0, -4);
    }
    const objectName = `${surveyId}/${audioId}.mp3`;

    minioClient.getObject(bucketName, objectName, (err, stream) => {
        if (err) {
            console.error("Minio getObject error:", err);
            res.status(500).send('Error retrieving audio');
            return;
        }
        res.setHeader('Content-Type', 'audio/mpeg');
        stream.pipe(res);
    });
});

export default speech_conversion_router;