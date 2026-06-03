import { Survey } from "../mongodb/surveySchema.js";
import connectDB from "../mongodb/connect.js";
import { b64toMp3, generate_audio } from "./audio_helpers.js";
import { uploadAudio } from "./minio/file_uploads.js";

export async function audio_generation(surveyId) {
    console.log(`\n--- Starting Audio Generation for Survey: ${surveyId} ---`);

    let survey = await Survey.findOne({ surveyId: surveyId });
    if (!survey) {
        console.error("Survey not found!");
        return;
    }

    const supported_languages = survey.supportedLanguages;
    console.log(`Supported Languages: ${supported_languages.join(", ")}`);

    let updatesMade = false;

    for (const section of survey.questionSections) {
        console.log(`\n> Processing Section: ${section.sectionName}`);

        for (const question of section.questions) {
            for (const language of supported_languages) {
                // temporary
                if (language === 'malyalam') {
                    continue;
                }

                // In Mongoose, 'audio' and 'text' are Maps. Use .get() to access values.
                if (!question.audio) {
                    question.audio = new Map();
                }
                const currentAudio = question.audio.get(language);

                if (currentAudio && currentAudio.trim() !== "") {
                    console.log(`[Audio Task] QID: ${question.qid} | Lang: ${language} -> Audio already exists, skipping.`);
                    continue;
                }

                // 1. Build the translation script
                let scriptText = question.text.get(language) || "";

                // If MCQ/Checkbox, we probably want to read the options out loud too
                if (question.type === "mcq" || question.type === "checkbox") {
                    const optionTexts = question.options
                        .map(opt => opt.label.get(language))
                        .filter(Boolean)
                        .join(". ");
                    if (optionTexts) {
                        scriptText += ".. " + optionTexts;
                    }
                }

                console.log(`\n[Audio Task] QID: ${question.qid} | Lang: ${language}`);
                console.log(`[Script]: "${scriptText}"`);

                // 2. Generate audio using external api
                const audio_base64 = await generate_audio(scriptText, language);
                const audioId = crypto.randomUUID();
                const fileName = `${audioId}.mp3`;
                await b64toMp3(audio_base64, "audio", fileName);
                await uploadAudio(surveyId, fileName);

                question.audio.set(language, fileName);
                updatesMade = true;
            }
        }
    }

    if (updatesMade) {
        console.log("\nSaving survey updates to MongoDB...");
        await Survey.updateOne(
            { surveyId: surveyId },
            { $set: { questionSections: survey.questionSections } }
        );
        console.log("Save complete.");
    } else {
        console.log("\nNo new audio needed to be generated.");
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