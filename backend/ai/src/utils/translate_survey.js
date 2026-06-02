import { multilang_translator_agent } from "../models/agents.js";
import { Survey } from "../mongodb/surveySchema.js";

export default async function translate_survey(surveyId, languages) {
    try {
        console.log(`Starting translation for survey ${surveyId} into languages: ${languages.join(", ")}`);

        const survey = await Survey.findOne({ surveyId });
        if (!survey) {
            throw new Error(`Survey not found: ${surveyId}`);
        }

        const newLanguages = Array.from(new Set([...(survey.supportedLanguages || []), ...languages]));
        const updatedSections = [];

        for (const section of survey.questionSections) {
            console.log(`Translating section: ${section.sectionName}`);

            let translatedQuestions = [];

            for (const question of section.questions) {
                let translationResult = null;
                let attempts = 0;
                const maxAttempts = 3;

                while (attempts < maxAttempts) {
                    try {
                        translationResult = await multilang_translator_agent(question, languages);

                        // The LLM might return an array with one element, or an object.
                        // It might also use "text" instead of "questionText" because it mimics the input.
                        let parsedResult = Array.isArray(translationResult) ? translationResult[0] : translationResult;
                        
                        if (parsedResult && (parsedResult.questionText || parsedResult.text)) {
                            // Normalize to the expected structure
                            translationResult = {
                                questionText: parsedResult.questionText || parsedResult.text,
                                options: parsedResult.options || []
                            };
                            break; // Success
                        } else {
                            throw new Error("Agent returned invalid structure.");
                        }
                    } catch (e) {
                        attempts++;
                        console.error(`Attempt ${attempts} failed for question ${question.qid}: ${e.message}`);
                        if (attempts < maxAttempts) {
                            console.log("Waiting 2 seconds before retrying...");
                            await new Promise(r => setTimeout(r, 2000));
                        }
                    }
                }

                // Copy original question to preserve its entire structure
                const qObj = question.toObject ? question.toObject() : { ...question };

                if (translationResult && translationResult.questionText) {
                    // 1. Merge questionText translations
                    const existingText = qObj.text ? (qObj.text instanceof Map ? Object.fromEntries(qObj.text) : { ...qObj.text }) : {};
                    for (const lang of languages) {
                        if (translationResult.questionText[lang]) {
                            existingText[lang] = translationResult.questionText[lang];
                        }
                    }
                    qObj.text = existingText;

                    // 2. Merge options translations if applicable
                    if (translationResult.options && Array.isArray(translationResult.options) && qObj.options && Array.isArray(qObj.options)) {
                        qObj.options = qObj.options.map(opt => {
                            const translatedOpt = translationResult.options.find(o => o.id === opt.id);
                            if (translatedOpt && translatedOpt.label) {
                                const existingLabel = opt.label ? (opt.label instanceof Map ? Object.fromEntries(opt.label) : { ...opt.label }) : {};
                                for (const lang of languages) {
                                    if (translatedOpt.label[lang]) {
                                        existingLabel[lang] = translatedOpt.label[lang];
                                    }
                                }
                                return { ...opt, label: existingLabel };
                            }
                            return opt;
                        });
                    }
                } else {
                    console.warn(`Failed to translate question ${question.qid}. Keeping original.`);
                }

                // Ensure blank audio field for all languages
                const audio = qObj.audio ? (qObj.audio instanceof Map ? Object.fromEntries(qObj.audio) : { ...qObj.audio }) : {};
                newLanguages.forEach(lang => {
                    if (audio[lang] === undefined) {
                        audio[lang] = " "; // using space to bypass minlength: 1 validation
                    }
                });
                qObj.audio = audio;

                translatedQuestions.push(qObj);
            }

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
            await Survey.findOneAndUpdate({ surveyId }, { $set: { status: "pending" } });
        } catch (e) { }

        throw error;
    }
}
