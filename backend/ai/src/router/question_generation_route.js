// router for question generation
import { Router } from "express";
import crypto from "crypto";
import { Survey } from "../mongodb/surveySchema.js";
import generate_english_questions_retry from "../utils/generate_questions.js";

const question_generation_router = Router();

// health 
question_generation_router.get('/', (req, res) => {
    res.json("Question Generation Route Active");
});

question_generation_router.post('/generate_questions_english', async (req, res) => {
    const { user_query } = req.body;
    
    if (!user_query) {
        return res.status(400).json({ error: "user_query is required" });
    }

    // Pre-generate a MongoDB surveyId
    const surveyId = crypto.randomUUID();

    try {
        // Create an initial placeholder document in Mongo
        const initialSurvey = new Survey({
            surveyId: surveyId,
            name: `Survey on ${user_query}`.substring(0, 100),
            status: "pending",
            supportedLanguages: ["english"],
            questionSections: [], // Empty initially
            categories: ["AI Generated"],
            createdBy: "AI-Agent"
        });
        await initialSurvey.save();
    } catch (e) {
        console.error("Error creating initial pending survey:", e);
        return res.status(500).json({ error: "Failed to initialize survey in database" });
    }

    // Fire and forget - do not await
    generate_english_questions_retry(user_query, surveyId)
        .then(() => console.log(`Generation finished for ${surveyId}`))
        .catch(err => console.error(`Generation failed for ${surveyId}:`, err));

    res.json({ 
        surveyId: surveyId, 
        status: "processing" 
    });
});

question_generation_router.get('/poll_questions_english/:surveyId', async (req, res) => {
    const { surveyId } = req.params;

    try {
        const survey = await Survey.findOne({ surveyId: surveyId });
        
        if (!survey) {
            return res.status(404).json({ error: "Survey not found." });
        }
        
        // Using "complete" to signal done, or just checking questionSections length
        if (survey.status === "complete" || (survey.questionSections && survey.questionSections.length > 0)) {
            return res.json({ status: "completed", data: survey });
        } else {
            return res.json({ status: "processing" });
        }
    } catch (err) {
        console.error("Error polling survey:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

question_generation_router.post('/improve_section_english', async (req, res) => {
    const { surveyId, sectionName, instructions } = req.body;
    
    if (!surveyId || !sectionName || !instructions) {
        return res.status(400).json({ error: "surveyId, sectionName, and instructions are required" });
    }

    try {
        // Find if survey exists to prevent blind processing
        const survey = await Survey.findOne({ surveyId });
        if (!survey) {
            return res.status(404).json({ error: "Survey not found." });
        }
        
        // Optionally mark survey as updating so poll endpoint knows
        await Survey.findOneAndUpdate({ surveyId }, { $set: { status: "updating" } });

        // Wait for generation to complete
        const { default: improve_english_section } = await import("../utils/improve_section.js");
        
        await improve_english_section(surveyId, sectionName, instructions);
        
        console.log(`Section ${sectionName} improved for ${surveyId}`);
        // Revert status to complete
        await Survey.findOneAndUpdate({ surveyId }, { $set: { status: "complete" } });

        res.json({ 
            surveyId: surveyId, 
            sectionName: sectionName,
            status: "completed" 
        });

    } catch (e) {
        console.error("Error initiating section improvement:", e);
        // Revert status to complete in case of error so it's not stuck
        Survey.findOneAndUpdate({ surveyId }, { $set: { status: "complete" } }).exec();
        return res.status(500).json({ error: "Internal Server Error" });
    }
});
question_generation_router.post('/generate_questions_multilang', async (req, res) => {
    const { surveyId, languages } = req.body;
    
    if (!surveyId || !languages || !Array.isArray(languages) || languages.length === 0) {
        return res.status(400).json({ error: "surveyId and a non-empty array of languages are required" });
    }

    try {
        const survey = await Survey.findOne({ surveyId });
        if (!survey) {
            return res.status(404).json({ error: "Survey not found." });
        }
        
        // Mark survey as translating
        await Survey.findOneAndUpdate({ surveyId }, { $set: { status: "translating" } });

        // Fire and forget translation
        import("../utils/translate_survey.js").then(({ default: translate_survey }) => {
            translate_survey(surveyId, languages).catch(err => {
                console.error(`Translation failed for ${surveyId}:`, err);
            });
        });

        res.json({ 
            surveyId: surveyId, 
            status: "processing" 
        });

    } catch (e) {
        console.error("Error initiating multilang translation:", e);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

question_generation_router.get('/poll_questions_multilang/:surveyId', async (req, res) => {
    const { surveyId } = req.params;

    try {
        const survey = await Survey.findOne({ surveyId });
        
        if (!survey) {
            return res.status(404).json({ error: "Survey not found." });
        }
        
        if (survey.status === "complete") {
            return res.json({ status: "completed", data: survey });
        } else {
            return res.json({ status: "processing" });
        }
    } catch (err) {
        console.error("Error polling multilang survey:", err);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

export default question_generation_router;