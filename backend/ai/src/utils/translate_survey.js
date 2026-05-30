import { multilang_translator_agent } from "../models/agents.js";
import { Survey } from "../mongodb/surveySchema.js";

export default async function translate_survey(surveyId, languages) {
    try {
        console.log(`Starting translation for survey ${surveyId} into languages: ${languages.join(", ")}`);

        const survey = await Survey.findOne({ surveyId });
        if (!survey) {
            throw new Error(`Survey not found: ${surveyId}`);
        }

        const updatedSections = [];

        for (const section of survey.questionSections) {
            console.log(`Translating section: ${section.sectionName}`);
            
            let translatedQuestions = null;
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    translatedQuestions = await multilang_translator_agent(section.questions, languages);
                    
                    if (Array.isArray(translatedQuestions) && translatedQuestions.length > 0) {
                        break; // Success
                    } else {
                        throw new Error("Agent returned invalid or empty array.");
                    }
                } catch (e) {
                    attempts++;
                    console.error(`Attempt ${attempts} failed for section ${section.sectionName}: ${e.message}`);
                    if (attempts < maxAttempts) {
                        console.log("Waiting 5 seconds before retrying...");
                        await new Promise(r => setTimeout(r, 5000));
                    }
                }
            }

            if (!translatedQuestions) {
                console.warn(`Failed to translate section ${section.sectionName}. Falling back to original english questions.`);
                translatedQuestions = section.questions; // Fallback
            }

            updatedSections.push({
                sectionName: section.sectionName,
                questions: translatedQuestions
            });
        }

        console.log(`Saving translated survey to MongoDB...`);
        
        // Add new languages to supportedLanguages without duplicates
        const newLanguages = Array.from(new Set([...survey.supportedLanguages, ...languages]));

        const updatedSurvey = await Survey.findOneAndUpdate(
            { surveyId },
            { 
                $set: { 
                    questionSections: updatedSections,
                    supportedLanguages: newLanguages,
                    status: "complete" 
                } 
            },
            { new: true }
        );

        console.log("Survey translation complete and saved!");
        return updatedSurvey;

    } catch (error) {
        console.error("Error during survey translation:", error);
        
        // Revert status on critical failure
        try {
            await Survey.findOneAndUpdate({ surveyId }, { $set: { status: "complete" } });
        } catch(e) {}
        
        throw error;
    }
}
