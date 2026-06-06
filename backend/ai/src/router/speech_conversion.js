// router for question generation
import { Router } from "express";
import minioClient from "../utils/minio/client.js";
import stt_from_twilio_whisper, { stt_from_twilio_sarvam } from "../utils/stt.js";
import { audio_generation } from "../utils/audio_generation.js";
import { Survey } from "../mongodb/surveySchema.js";
import { surveyLogs } from "./question_generation_route.js";
import { logger } from "../utils/logger.js";

const speech_conversion_router = Router();

// health 
speech_conversion_router.get('/', (req, res) => {
    res.json("Speech Generation Route Active")
})

// stt from twilio
speech_conversion_router.post('/stt-twilio', async (req, res) => {
    try {
        const { url } = req.body;
        const transcription = await stt_from_twilio_whisper(url);
        res.json(transcription);
    } catch (e) {
        logger.error("Error in stt-twilio:", e);
        res.status(500).json({ error: "Transcription failed" });
    }
})

speech_conversion_router.post('/stt-twilio-sarvam', async (req, res) => {
    try {
        const { url } = req.body;
        const transcription = await stt_from_twilio_sarvam(url);
        res.json(transcription);
    } catch (e) {
        logger.error("Error in stt-twilio-sarvam:", e);
        res.status(500).json({ error: "Transcription failed" });
    }
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
    
    // Check if it's a static avatar audio
    if (audioId.startsWith('static_')) {
        surveyId = 'avatar-statics';
    }

    const objectName = `${surveyId}/${audioId}.mp3`;

    minioClient.getObject(bucketName, objectName, (err, stream) => {
        if (err) {
            logger.error("Minio getObject error:", err);
            res.status(500).send('Error retrieving audio');
            return;
        }
        res.setHeader('Content-Type', 'audio/mpeg');
        stream.pipe(res);
    });
});

// Avatar Dynamic Script Route
speech_conversion_router.get('/avatar/script/:surveyId/:language', async (req, res) => {
    try {
        const { surveyId, language } = req.params;
        const survey = await Survey.findOne({ surveyId });
        
        if (!survey) {
            return res.status(404).json({ error: "Survey not found" });
        }

        const script = [];
        script.push({ step: "greeting", audioId: `static_greeting_${language}` });

        for (const section of survey.questionSections) {
            for (const question of section.questions) {
                // Determine if there is pre-generated audio for this question
                let qAudioId = null;
                if (question.audio && question.audio.get(language)) {
                    qAudioId = question.audio.get(language);
                }

                // Add Question Audio Node
                script.push({
                    step: "question",
                    qid: question.qid,
                    questionType: question.type,
                    audioId: qAudioId,
                    fallbackText: question.text.get(language) || question.text.get("english")
                });

                // Add Instruction Audio Node
                script.push({
                    step: "instruction",
                    audioId: `static_${question.type}_${language}`
                });
            }
        }

        script.push({ step: "outro", audioId: `static_outro_${language}` });

        return res.json({ script });
    } catch (e) {
        logger.error("Error generating avatar script:", e);
        res.status(500).json({ error: "Failed to generate script" });
    }
});

speech_conversion_router.get("/generate_audio/:surveyId", async (req, res) => {
    try {
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
    } catch (e) {
        logger.error("Error generating audio:", e);
        res.status(500).json({ error: "Failed to generate audio" });
    }
})

speech_conversion_router.delete("/delete_audio/:surveyId", async (req, res) => {
    try {
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
    } catch (e) {
        logger.error("Error deleting audio:", e);
        res.status(500).send("Error deleting audio");
    }
});

export default speech_conversion_router;