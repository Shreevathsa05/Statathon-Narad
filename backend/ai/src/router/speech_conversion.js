// router for question generation
import { Router } from "express";
import minioClient from "../utils/minio/client.js";
import stt_from_twilio_whisper, { stt_from_twilio_sarvam } from "../utils/stt.js";
import { audio_generation } from "../utils/audio_generation.js";
import { Survey } from "../mongodb/surveySchema.js";

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
        return res.status(404).send("Survey not found");
    }

    // Check if audio generation has been completed by checking the first question's audio
    if (survey.questionSections && survey.questionSections.length > 0 &&
        survey.questionSections[0].questions && survey.questionSections[0].questions.length > 0) {
        
        const firstQuestion = survey.questionSections[0].questions[0];
        const firstLang = survey.supportedLanguages && survey.supportedLanguages.length > 0 
            ? survey.supportedLanguages[0] 
            : "english";

        if (firstQuestion.audio && firstQuestion.audio.get(firstLang)) {
            return res.send("Audio generation completed");
        }
    }
    
    // If not completed, start generation in the background
    audio_generation(surveyId);
    return res.send("Audio generation started");
})

speech_conversion_router.delete("/delete_audio/:surveyId", async (req, res) => {
    const surveyId = req.params.surveyId;
    const survey = await Survey.findOne({ surveyId: surveyId });
    
    if (!survey) {
        return res.status(404).send("Survey not found");
    }

    let updatesMade = false;
    // Iterate through all sections and questions to clear the audio maps
    for (const section of survey.questionSections) {
        for (const question of section.questions) {
            if (question.audio) {
                // For every language that has an audio ID, clear it
                for (const language of question.audio.keys()) {
                    // You could also add minioClient.removeObject(...) here if you want to delete the actual files
                    if (question.audio.get(language).trim() !== "") {
                        question.audio.set(language, "");
                        updatesMade = true;
                    }
                }
            }
        }
    }

    if (updatesMade) {
        await Survey.updateOne(
            { surveyId: surveyId },
            { $set: { questionSections: survey.questionSections } }
        );
        return res.send("All audio IDs have been cleared from the database.");
    }

    return res.send("No audio IDs were found to delete.");
});

export default speech_conversion_router;