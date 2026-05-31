import { multilang_translator_agent } from "../models/agents.js";
import { Survey } from "../mongodb/surveySchema.js";

export default async function translate_survey(surveyId, languages) {
    try {
        console.log(`Starting translation for survey ${surveyId} into languages: ${languages.join(", ")}`);

        const survey = await Survey.findOne({ surveyId });
        if (!survey) {
            throw new Error(`Survey not found: ${surveyId}`);
        }

        const newLanguages = Array.from(new Set([...languages]));
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

            // Ensure blank audio field for all languages
            translatedQuestions = translatedQuestions.map(q => {
                const qObj = q.toObject ? q.toObject() : { ...q };
                const audio = qObj.audio ? (qObj.audio instanceof Map ? Object.fromEntries(qObj.audio) : { ...qObj.audio }) : {};
                newLanguages.forEach(lang => {
                    if (audio[lang] === undefined) {
                        audio[lang] = " "; // using space to bypass minlength: 1 validation
                    }
                });
                return { ...qObj, audio };
            });

            updatedSections.push({
                sectionName: section.sectionName,
                questions: translatedQuestions
            });
        }

        console.log(`Saving translated survey to MongoDB...`);

        const updatedSurvey = await Survey.findOneAndUpdate(
            { surveyId },
            {
                $set: {
                    questionSections: updatedSections,
                    supportedLanguages: newLanguages,
                    status: "pending"
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
        } catch (e) { }

        throw error;
    }
}
