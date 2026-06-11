import { Survey } from "../mongodb/surveySchema.js";
import connectDB from "../mongodb/connect.js";
import { b64toMp3, generate_audio } from "./audio_helpers.js";
import { uploadAudio } from "./minio/file_uploads.js";
import { surveyLogs } from "../router/question_generation_route.js";
import { logger } from "./logger.js";

export async function audio_generation(surveyId) {
    const log = (msg) => {
        logger.info(msg);
        if (!surveyLogs.has(surveyId)) surveyLogs.set(surveyId, []);
        surveyLogs.get(surveyId).push(msg);
    };

    log(`\n--- Starting Audio Generation for Survey: ${surveyId} ---`);

    let survey = await Survey.findOne({ surveyId: surveyId });
    if (!survey) {
        logger.error("Survey not found!");
        return;
    }

    const supported_languages = survey.supportedLanguages;
    log(`Audio Generation Agent Started for languages: ${supported_languages.join(", ")}`);

    // Pre-scan for referenced variables
    const referencedQids = new Set();
    for (const section of survey.questionSections) {
        for (const question of section.questions) {
            for (const language of supported_languages) {
                const text = question.text.get(language) || "";
                const matches = [...text.matchAll(/\{\{(.*?)\}\}/g)];
                matches.forEach(match => referencedQids.add(match[1]));
            }
        }
    }
    log(`Referenced QIDs detected: ${Array.from(referencedQids).join(", ")}`);

    let updatesMade = false;

    for (const section of survey.questionSections) {
        logger.info(`\n> Processing Section: ${section.sectionName}`);

        for (const question of section.questions) {
            for (const language of supported_languages) {
                // temporary
                if (language === 'malayalam') {
                    continue;
                }

                if (!question.audio) question.audio = new Map();
                if (!question.audioParts) question.audioParts = new Map();
                const currentAudio = question.audio.get(language);
                const currentParts = question.audioParts.get(language);
                
                let isMainAudioDone = (currentAudio && currentAudio.trim() !== "") || (currentParts && currentParts.length > 0);

                let scriptText = question.text.get(language) || "";
                const matches = [...scriptText.matchAll(/\{\{(.*?)\}\}/g)];
                const hasVariables = matches.length > 0;

                if (!isMainAudioDone && scriptText.trim() !== "") {
                    log(`[Audio Task] QID: ${question.qid} | Lang: ${language} -> Generating main audio...`);
                    
                    if (hasVariables) {
                        const partsArray = [];
                        let lastIndex = 0;
                        
                        for (const match of matches) {
                            const staticText = scriptText.substring(lastIndex, match.index).trim();
                            if (staticText) {
                                try {
                                    const audio_base64 = await generate_audio(staticText, language);
                                    const audioId = crypto.randomUUID();
                                    const fileName = `${audioId}.mp3`;
                                    await b64toMp3(audio_base64, "audio", fileName);
                                    await uploadAudio(surveyId, fileName);
                                    partsArray.push({ type: "text", audioId: fileName });
                                    updatesMade = true;
                                } catch (err) {
                                    log(`[Audio Task] Chunk Generation failed: ${err.message}`);
                                }
                            }
                            partsArray.push({ type: "variable", refQid: match[1] });
                            lastIndex = match.index + match[0].length;
                        }
                        
                        const remainingText = scriptText.substring(lastIndex).trim();
                        if (remainingText) {
                            try {
                                const audio_base64 = await generate_audio(remainingText, language);
                                const audioId = crypto.randomUUID();
                                const fileName = `${audioId}.mp3`;
                                await b64toMp3(audio_base64, "audio", fileName);
                                await uploadAudio(surveyId, fileName);
                                partsArray.push({ type: "text", audioId: fileName });
                                updatesMade = true;
                            } catch (err) {
                                log(`[Audio Task] Chunk Generation failed: ${err.message}`);
                            }
                        }
                        
                        question.audioParts.set(language, partsArray);
                        question.audio.set(language, "stitched"); // Mark as done
                        updatesMade = true;
                    } else {
                        // Normal generation
                        if (question.type === "mcq" || question.type === "checkbox") {
                            const optionTexts = question.options
                                .map(opt => opt.label.get(language))
                                .filter(Boolean)
                                .join(". ");
                            if (optionTexts) {
                                scriptText += ".. " + optionTexts;
                            }
                        }

                        try {
                            const audio_base64 = await generate_audio(scriptText, language);
                            const audioId = crypto.randomUUID();
                            const fileName = `${audioId}.mp3`;
                            await b64toMp3(audio_base64, "audio", fileName);
                            await uploadAudio(surveyId, fileName);
                            question.audio.set(language, fileName);
                            updatesMade = true;
                        } catch (err) {
                            log(`[Audio Task] QID: ${question.qid} | Lang: ${language} -> Generation failed: ${err.message}`);
                            logger.error(err);
                        }
                    }
                }

                // Generate Options Audio if this question is referenced
                if ((question.type === "mcq" || question.type === "checkbox") && referencedQids.has(question.qid)) {
                    for (const opt of question.options) {
                        if (!opt.audio) opt.audio = new Map();
                        const optText = opt.label.get(language);
                        if (optText && (!opt.audio.has(language) || opt.audio.get(language).trim() === "")) {
                            log(`[Audio Task] QID: ${question.qid} | Opt: ${opt.id} | Lang: ${language} -> Generating option audio...`);
                            try {
                                const audio_base64 = await generate_audio(optText, language);
                                const audioId = crypto.randomUUID();
                                const fileName = `${audioId}.mp3`;
                                await b64toMp3(audio_base64, "audio", fileName);
                                await uploadAudio(surveyId, fileName);
                                opt.audio.set(language, fileName);
                                updatesMade = true;
                            } catch (err) {
                                log(`[Audio Task] Option Generation failed: ${err.message}`);
                            }
                        }
                    }
                }
            }
        }
    }

    if (updatesMade) {
        logger.info("\nSaving survey updates to MongoDB...");
        await Survey.updateOne(
            { surveyId: surveyId },
            { 
                $set: { 
                    questionSections: survey.questionSections,
                    status: "pending" 
                } 
            }
        );
        log("Audio Generation Agent Completed.");
    } else {
        await Survey.updateOne({ surveyId: surveyId }, { $set: { status: "pending" } });
        log("Audio Generation Agent Completed.");
    }
}



// // // Execute the standalone script
// await connectDB().then(() => {
//     audio_generation("d05ba87f-8631-4757-8433-4463d0916319")
//         .then(() => process.exit(0))
//         .catch(err => {
//             console.error(err);
//             process.exit(1);
//         });
// });