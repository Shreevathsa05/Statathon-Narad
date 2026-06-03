// router for question generation
import { Router } from "express";
import minioClient from "../utils/minio/client.js";
import stt_from_twilio_whisper, { stt_from_twilio_sarvam } from "../utils/stt.js";
import { audio_generation } from "../utils/audio_generation.js";
import { Survey } from "../mongodb/surveySchema.js";
import { surveyLogs } from "./question_generation_route.js";

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

speech_conversion_router.get("/generate_audio/:surveyId", async (req, res) => {
    const surveyId = req.params.surveyId;
    const survey = await Survey.findOne({ surveyId: surveyId });
    
    if (!survey) {
        return res.status(404).json({ error: "Survey not found" });
    }

    // Check if audio generation has been completed by checking the first question's audio
    if (survey.questionSections && survey.questionSections.length > 0 &&
        survey.questionSections[0].questions && survey.questionSections[0].questions.length > 0) {
        
        const firstQuestion = survey.questionSections[0].questions[0];
        const firstLang = survey.supportedLanguages && survey.supportedLanguages.length > 0 
            ? survey.supportedLanguages[0] 
            : "english";

        const firstLangAudio = firstQuestion.audio && firstQuestion.audio.get(firstLang);
        if (firstLangAudio && firstLangAudio.trim() !== "") {
            return res.json({ status: "completed", message: "Audio generation completed" });
        }
    }
    
    // If not completed, start generation in the background
    await Survey.findOneAndUpdate({ surveyId }, { $set: { status: "generating_audio" } });
    surveyLogs.delete(surveyId);
    
    audio_generation(surveyId);
    return res.json({ surveyId, status: "generating_audio" });
})

export default speech_conversion_router;